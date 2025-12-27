const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Day name to dayjs day number mapping
 * dayjs: 0=Sunday, 1=Monday, ..., 6=Saturday
 */
const DAY_MAP = {
  'Sun': 0,
  'Mon': 1,
  'Tue': 2,
  'Wed': 3,
  'Thu': 4,
  'Fri': 5,
  'Sat': 6
};

/**
 * Generate class instances for a schedule rule
 * This function is IDEMPOTENT - it only creates missing instances
 *
 * @param {Object} scheduleRule - The schedule rule document
 * @param {String} userTimezone - User's timezone (e.g., 'America/New_York')
 * @param {Number} weeksAhead - Number of weeks to generate (default: 4)
 * @param {Date} startFromDate - Optional start date (defaults to today in user's timezone)
 * @returns {Array} Array of class instance objects to be inserted
 */
async function generateClassInstances(scheduleRule, userTimezone, weeksAhead = 4, startFromDate = null) {
  const ClassInstance = require('../models/ClassInstance');

  // Get today in user's timezone, then convert to UTC midnight
  const today = startFromDate
    ? dayjs(startFromDate).tz(userTimezone).startOf('day')
    : dayjs().tz(userTimezone).startOf('day');

  const endDate = today.add(weeksAhead, 'week');

  const instancesData = [];

  // For each day in the schedule rule
  for (const dayName of scheduleRule.daysOfWeek) {
    const targetDayNumber = DAY_MAP[dayName];

    // Find the first occurrence of this day starting from today
    let currentDate = today.clone();

    // Move to the target day of the week
    const todayDayNumber = currentDate.day();
    const daysToAdd = (targetDayNumber - todayDayNumber + 7) % 7;

    if (daysToAdd > 0) {
      currentDate = currentDate.add(daysToAdd, 'day');
    }
    // If daysToAdd is 0, it means today is the target day, keep currentDate as is

    // Generate instances week by week
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      // Convert to UTC midnight for storage
      const dateUTC = currentDate.utc().startOf('day').toDate();

      // Check if this instance already exists
      const existingInstance = await ClassInstance.findOne({
        user: scheduleRule.user,
        subject: scheduleRule.subject,
        date: dateUTC,
        startTime: scheduleRule.startTime
      });

      if (!existingInstance) {
        instancesData.push({
          user: scheduleRule.user,
          subject: scheduleRule.subject,
          scheduleRule: scheduleRule._id,
          date: dateUTC,
          startTime: scheduleRule.startTime,
          endTime: scheduleRule.endTime,
          status: 'pending'
        });
      }

      // Move to next week
      currentDate = currentDate.add(1, 'week');
    }
  }

  return instancesData;
}

/**
 * Ensure class instances exist for the next N days
 * Used when dashboard loads to guarantee upcoming classes exist
 *
 * @param {String} userId - User ID
 * @param {String} userTimezone - User's timezone
 * @param {Number} daysAhead - Number of days to check (default: 7)
 */
async function ensureUpcomingInstances(userId, userTimezone, daysAhead = 7) {
  const ScheduleRule = require('../models/ScheduleRule');
  const ClassInstance = require('../models/ClassInstance');

  // Get all active schedule rules for this user
  const scheduleRules = await ScheduleRule.find({ user: userId }).populate('subject');

  if (scheduleRules.length === 0) {
    return { created: 0, message: 'No schedule rules found' };
  }

  const today = dayjs().tz(userTimezone).startOf('day');
  const endDate = today.add(daysAhead, 'day');

  let totalCreated = 0;

  for (const rule of scheduleRules) {
    const instancesData = [];

    for (const dayName of rule.daysOfWeek) {
      const targetDayNumber = DAY_MAP[dayName];

      let currentDate = today.clone();
      const todayDayNumber = currentDate.day();
      const daysToAdd = (targetDayNumber - todayDayNumber + 7) % 7;

      if (daysToAdd > 0) {
        currentDate = currentDate.add(daysToAdd, 'day');
      }

      // Check dates within the range
      while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        const dateUTC = currentDate.utc().startOf('day').toDate();

        const existingInstance = await ClassInstance.findOne({
          user: userId,
          subject: rule.subject._id,
          date: dateUTC,
          startTime: rule.startTime
        });

        if (!existingInstance) {
          instancesData.push({
            user: userId,
            subject: rule.subject._id,
            scheduleRule: rule._id,
            date: dateUTC,
            startTime: rule.startTime,
            endTime: rule.endTime,
            status: 'pending'
          });
        }

        currentDate = currentDate.add(1, 'week');
      }
    }

    if (instancesData.length > 0) {
      await ClassInstance.insertMany(instancesData, { ordered: false })
        .catch(err => {
          // Ignore duplicate key errors (race condition protection)
          if (err.code !== 11000) {
            throw err;
          }
        });

      totalCreated += instancesData.length;
    }
  }

  return {
    created: totalCreated,
    message: `Ensured ${totalCreated} class instances for next ${daysAhead} days`
  };
}

/**
 * Regenerate all future class instances for a schedule rule
 * Used when a schedule rule is updated
 *
 * @param {String} scheduleRuleId - Schedule rule ID
 * @param {String} userTimezone - User's timezone
 */
async function regenerateClassInstances(scheduleRuleId, userTimezone) {
  const ScheduleRule = require('../models/ScheduleRule');
  const ClassInstance = require('../models/ClassInstance');

  const scheduleRule = await ScheduleRule.findById(scheduleRuleId);

  if (!scheduleRule) {
    throw new Error('Schedule rule not found');
  }

  // Delete all future pending instances for this schedule rule
  const today = dayjs().tz(userTimezone).startOf('day').utc().toDate();

  const deleteResult = await ClassInstance.deleteMany({
    scheduleRule: scheduleRuleId,
    date: { $gte: today },
    status: 'pending' // Only delete pending ones, keep marked ones
  });

  console.log(`Deleted ${deleteResult.deletedCount} pending instances for schedule rule ${scheduleRuleId}`);

  // Generate new instances for next 4 weeks
  const instancesData = await generateClassInstances(scheduleRule, userTimezone, 4);

  if (instancesData.length > 0) {
    const insertResult = await ClassInstance.insertMany(instancesData, { ordered: false })
      .catch(err => {
        if (err.code !== 11000) {
          throw err;
        }
        return { length: 0 };
      });

    console.log(`Created ${instancesData.length} new instances for schedule rule ${scheduleRuleId}`);
  }

  return {
    deleted: deleteResult.deletedCount,
    created: instancesData.length,
    message: `Regenerated class instances: deleted ${deleteResult.deletedCount}, created ${instancesData.length}`
  };
}

/**
 * Convert a date from user's timezone to UTC midnight
 * Used for consistent date storage
 *
 * @param {String|Date} date - Date in user's timezone
 * @param {String} userTimezone - User's timezone
 * @returns {Date} UTC midnight date
 */
function toUTCMidnight(date, userTimezone) {
  return dayjs(date).tz(userTimezone).startOf('day').utc().toDate();
}

/**
 * Get date range for calendar queries
 *
 * @param {String} startDate - Start date (ISO string or Date)
 * @param {String} endDate - End date (ISO string or Date)
 * @param {String} userTimezone - User's timezone
 * @returns {Object} { start: Date, end: Date } in UTC
 */
function getDateRange(startDate, endDate, userTimezone) {
  const start = dayjs(startDate).tz(userTimezone).startOf('day').utc().toDate();
  const end = dayjs(endDate).tz(userTimezone).endOf('day').utc().toDate();

  return { start, end };
}

module.exports = {
  generateClassInstances,
  ensureUpcomingInstances,
  regenerateClassInstances,
  toUTCMidnight,
  getDateRange,
  DAY_MAP
};
