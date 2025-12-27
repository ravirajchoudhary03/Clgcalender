const ScheduleRule = require('../models/ScheduleRule');
const Subject = require('../models/Subject');
const ClassInstance = require('../models/ClassInstance');
const { generateClassInstances, regenerateClassInstances } = require('../utils/classGenerator');

/**
 * Create or update schedule rule for a subject
 * POST /api/schedule
 */
exports.createOrUpdateSchedule = async (req, res) => {
  try {
    const { subjectId, daysOfWeek, startTime, endTime } = req.body;
    const userId = req.user.id;
    const userTimezone = req.user.timezone;

    // Validate required fields
    if (!subjectId || !daysOfWeek || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide subjectId, daysOfWeek, startTime, and endTime'
      });
    }

    // Validate daysOfWeek is array
    if (!Array.isArray(daysOfWeek) || daysOfWeek.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'daysOfWeek must be a non-empty array'
      });
    }

    // Verify subject exists and belongs to user
    const subject = await Subject.findOne({ _id: subjectId, user: userId });
    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found'
      });
    }

    // Check if schedule rule already exists for this subject
    let scheduleRule = await ScheduleRule.findOne({ user: userId, subject: subjectId });

    if (scheduleRule) {
      // Update existing schedule rule
      scheduleRule.daysOfWeek = daysOfWeek;
      scheduleRule.startTime = startTime;
      scheduleRule.endTime = endTime;
      await scheduleRule.save();

      console.log(`Updated schedule rule for subject ${subject.name}`);

      // Regenerate class instances for updated schedule
      const regenerateResult = await regenerateClassInstances(scheduleRule._id, userTimezone);

      return res.json({
        success: true,
        message: 'Schedule updated successfully',
        scheduleRule,
        regenerateResult
      });
    } else {
      // Create new schedule rule
      scheduleRule = await ScheduleRule.create({
        user: userId,
        subject: subjectId,
        daysOfWeek,
        startTime,
        endTime
      });

      console.log(`Created schedule rule for subject ${subject.name}`);

      // Generate class instances for next 4 weeks
      const instancesData = await generateClassInstances(scheduleRule, userTimezone, 4);

      if (instancesData.length > 0) {
        await ClassInstance.insertMany(instancesData, { ordered: false })
          .catch(err => {
            // Ignore duplicate key errors
            if (err.code !== 11000) {
              throw err;
            }
          });

        console.log(`Generated ${instancesData.length} class instances`);
      }

      return res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        scheduleRule,
        classInstancesCreated: instancesData.length
      });
    }
  } catch (error) {
    console.error('Create/Update schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error managing schedule',
      error: error.message
    });
  }
};

/**
 * Get all schedule rules for user
 * GET /api/schedule
 */
exports.getScheduleRules = async (req, res) => {
  try {
    const userId = req.user.id;

    const scheduleRules = await ScheduleRule.find({ user: userId })
      .populate('subject', 'name color')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: scheduleRules.length,
      scheduleRules
    });
  } catch (error) {
    console.error('Get schedule rules error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule rules',
      error: error.message
    });
  }
};

/**
 * Get schedule rule for a specific subject
 * GET /api/schedule/:subjectId
 */
exports.getScheduleBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const userId = req.user.id;

    const scheduleRule = await ScheduleRule.findOne({
      user: userId,
      subject: subjectId
    }).populate('subject', 'name color');

    if (!scheduleRule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule rule not found for this subject'
      });
    }

    res.json({
      success: true,
      scheduleRule
    });
  } catch (error) {
    console.error('Get schedule by subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching schedule rule',
      error: error.message
    });
  }
};

/**
 * Delete schedule rule
 * DELETE /api/schedule/:scheduleRuleId
 */
exports.deleteScheduleRule = async (req, res) => {
  try {
    const { scheduleRuleId } = req.params;
    const userId = req.user.id;
    const userTimezone = req.user.timezone;

    const scheduleRule = await ScheduleRule.findOne({
      _id: scheduleRuleId,
      user: userId
    });

    if (!scheduleRule) {
      return res.status(404).json({
        success: false,
        message: 'Schedule rule not found'
      });
    }

    // Delete all future pending class instances for this schedule rule
    const dayjs = require('dayjs');
    const timezone = require('dayjs/plugin/timezone');
    const utc = require('dayjs/plugin/utc');
    dayjs.extend(utc);
    dayjs.extend(timezone);

    const today = dayjs().tz(userTimezone).startOf('day').utc().toDate();

    const deleteResult = await ClassInstance.deleteMany({
      scheduleRule: scheduleRuleId,
      date: { $gte: today },
      status: 'pending'
    });

    // Delete the schedule rule
    await scheduleRule.deleteOne();

    console.log(`Deleted schedule rule and ${deleteResult.deletedCount} pending class instances`);

    res.json({
      success: true,
      message: 'Schedule rule deleted successfully',
      deletedInstances: deleteResult.deletedCount
    });
  } catch (error) {
    console.error('Delete schedule rule error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting schedule rule',
      error: error.message
    });
  }
};

/**
 * Get weekly schedule summary (for display)
 * GET /api/schedule/summary
 */
exports.getWeeklySummary = async (req, res) => {
  try {
    const userId = req.user.id;

    const scheduleRules = await ScheduleRule.find({ user: userId })
      .populate('subject', 'name color');

    // Organize by day of week
    const summary = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    };

    scheduleRules.forEach(rule => {
      rule.daysOfWeek.forEach(day => {
        summary[day].push({
          subject: rule.subject,
          startTime: rule.startTime,
          endTime: rule.endTime,
          scheduleRuleId: rule._id
        });
      });
    });

    // Sort each day by start time
    Object.keys(summary).forEach(day => {
      summary[day].sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
    });

    res.json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get weekly summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching weekly summary',
      error: error.message
    });
  }
};
