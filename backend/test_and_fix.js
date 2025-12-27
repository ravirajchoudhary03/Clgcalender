// Complete test and fix script - Run this to diagnose and fix everything
const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('./src/models/Subject');
const ClassInstance = require('./src/models/ClassInstance');
const User = require('./src/models/User');
const dayjs = require('dayjs');

// Helper to generate class instances
async function generateClassInstances(subject, weeksAhead = 4) {
  console.log(`   🔄 Generating instances for ${subject.name}...`);
  const instances = [];
  const today = dayjs().startOf('day');
  const endDate = today.add(weeksAhead, 'week');

  const dayMap = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  for (const slot of subject.schedule) {
    const targetDayNum = dayMap[slot.day];
    let currentDate = today;

    if (currentDate.day() > targetDayNum) {
      currentDate = currentDate.add(1, 'week').day(targetDayNum);
    } else {
      currentDate = currentDate.day(targetDayNum);
    }

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
      const existing = await ClassInstance.findOne({
        user: subject.user,
        subject: subject._id,
        date: currentDate.toDate(),
        startTime: slot.startTime,
      });

      if (!existing) {
        instances.push({
          user: subject.user,
          subject: subject._id,
          date: currentDate.toDate(),
          startTime: slot.startTime,
          endTime: slot.endTime,
          day: slot.day,
          status: 'pending',
        });
      }
      currentDate = currentDate.add(1, 'week');
    }
  }

  if (instances.length > 0) {
    await ClassInstance.insertMany(instances, { ordered: false }).catch(err => {
      if (err.code !== 11000) throw err;
    });
    console.log(`   ✅ Created ${instances.length} class instances`);
  } else {
    console.log(`   ℹ️  No new instances needed`);
  }
}

async function testAndFix() {
  console.log('\n🔧 ATTENDANCE TRACKER - TEST & FIX');
  console.log('=' .repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n[1] Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-tracker'
    );
    console.log('✅ Connected to MongoDB');

    // Check users
    console.log('\n[2] Checking users...');
    const users = await User.find({});
    if (users.length === 0) {
      console.log('❌ No users found! Create a user first by registering.');
      await mongoose.connection.close();
      process.exit(1);
    }
    const testUser = users[0];
    console.log(`✅ Found user: ${testUser.email}`);

    // Check subjects
    console.log('\n[3] Checking subjects...');
    let subjects = await Subject.find({ user: testUser._id });
    console.log(`   Found ${subjects.length} subjects`);

    // If no subjects, create test subject
    if (subjects.length === 0) {
      console.log('   Creating test subject...');
      const testSubject = new Subject({
        user: testUser._id,
        name: 'Test Subject',
        color: '#3B82F6',
        classesPerWeek: 3,
        schedule: [
          { day: 'Mon', startTime: '09:00', endTime: '10:00' },
          { day: 'Wed', startTime: '10:00', endTime: '11:00' },
          { day: 'Fri', startTime: '11:00', endTime: '12:00' },
        ],
      });
      await testSubject.save();
      console.log('✅ Created test subject with 3 time slots');
      subjects = [testSubject];
    }

    // Check subjects with schedules
    console.log('\n[4] Analyzing subjects...');
    const subjectsWithSchedule = subjects.filter(s => s.schedule && s.schedule.length > 0);
    console.log(`   Subjects with schedules: ${subjectsWithSchedule.length}`);

    if (subjectsWithSchedule.length === 0) {
      console.log('   ⚠️  No subjects have schedules!');
      console.log('   Adding schedule to first subject...');
      const firstSubject = subjects[0];
      firstSubject.schedule = [
        { day: 'Mon', startTime: '09:00', endTime: '10:00' },
        { day: 'Wed', startTime: '10:00', endTime: '11:00' },
        { day: 'Fri', startTime: '11:00', endTime: '12:00' },
      ];
      firstSubject.classesPerWeek = 3;
      await firstSubject.save();
      console.log('✅ Added schedule to subject');
      subjectsWithSchedule.push(firstSubject);
    }

    // Display subjects
    console.log('\n   📚 Subjects with schedules:');
    subjectsWithSchedule.forEach(s => {
      console.log(`      ${s.name}:`);
      s.schedule.forEach(slot => {
        console.log(`         - ${slot.day}: ${slot.startTime}-${slot.endTime}`);
      });
    });

    // Check class instances
    console.log('\n[5] Checking ClassInstances...');
    const totalInstances = await ClassInstance.countDocuments({ user: testUser._id });
    console.log(`   Total ClassInstances: ${totalInstances}`);

    const today = dayjs().startOf('day').toDate();
    const futureInstances = await ClassInstance.countDocuments({
      user: testUser._id,
      date: { $gte: today },
    });
    console.log(`   Future ClassInstances: ${futureInstances}`);

    // Generate instances if needed
    if (futureInstances === 0) {
      console.log('\n[6] Generating ClassInstances...');
      for (const subject of subjectsWithSchedule) {
        await generateClassInstances(subject, 4);
      }
      console.log('✅ ClassInstances generated');
    } else {
      console.log('\n[6] ClassInstances exist');
    }

    // Verify week data
    console.log('\n[7] Testing week data (what Dashboard sees)...');
    const weekStart = dayjs().startOf('week').add(1, 'day').toDate();
    const weekEnd = dayjs().endOf('week').add(1, 'day').toDate();
    const weekClasses = await ClassInstance.find({
      user: testUser._id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).populate('subject').lean();

    console.log(`   Classes for current week: ${weekClasses.length}`);
    if (weekClasses.length > 0) {
      console.log('   📅 This week\'s classes:');
      weekClasses.forEach(cls => {
        const date = dayjs(cls.date).format('ddd MMM DD');
        console.log(`      - ${date}: ${cls.subject?.name || 'Unknown'} ${cls.startTime}-${cls.endTime} [${cls.status}]`);
      });
    }

    // Check today's classes
    console.log('\n[8] Testing today\'s classes...');
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate();
    const todayClasses = await ClassInstance.find({
      user: testUser._id,
      date: { $gte: today, $lt: tomorrow },
    }).populate('subject').lean();

    console.log(`   Classes for today: ${todayClasses.length}`);
    if (todayClasses.length > 0) {
      console.log('   📅 Today\'s classes:');
      todayClasses.forEach(cls => {
        console.log(`      - ${cls.subject?.name || 'Unknown'} ${cls.startTime}-${cls.endTime} [${cls.status}]`);
      });
    } else {
      console.log('   ℹ️  No classes scheduled for today');
    }

    // Final verification
    console.log('\n[9] Final verification...');
    const finalCheck = await ClassInstance.countDocuments({
      user: testUser._id,
      date: { $gte: today },
    });

    console.log('\n' + '=' .repeat(60));
    console.log('RESULTS:');
    console.log('=' .repeat(60));
    console.log(`✅ User: ${testUser.email}`);
    console.log(`✅ Subjects: ${subjects.length}`);
    console.log(`✅ Subjects with schedules: ${subjectsWithSchedule.length}`);
    console.log(`✅ Total ClassInstances: ${await ClassInstance.countDocuments({ user: testUser._id })}`);
    console.log(`✅ Future ClassInstances: ${finalCheck}`);

    if (finalCheck > 0) {
      console.log('\n🎉 SUCCESS! Your data is ready!');
      console.log('\nNow do this:');
      console.log('1. Make sure backend is running (npm start)');
      console.log('2. Make sure frontend is running (npm run dev)');
      console.log('3. Clear browser cache (Ctrl+Shift+Delete)');
      console.log('4. Login as: ' + testUser.email);
      console.log('5. Go to Dashboard');
      console.log('6. Classes should appear in the calendar!');
      console.log('\nIf classes still don\'t appear:');
      console.log('- Check browser console (F12) for errors');
      console.log('- Check Network tab for API calls');
      console.log('- Make sure /api/attendance/classes/week returns data');
    } else {
      console.log('\n⚠️  Still no ClassInstances. Check logs above for errors.');
    }

    await mongoose.connection.close();
    console.log('\n👋 Database connection closed\n');
    process.exit(0);

  } catch (err) {
    console.error('\n❌ ERROR:', err.message);
    console.error(err);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testAndFix();
