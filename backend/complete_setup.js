// Complete Setup Script - Creates user, subjects, and class instances
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ClassInstance = require('./src/models/ClassInstance');
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
    console.log(`   ℹ️  All instances already exist`);
  }
}

async function completeSetup() {
  console.log('\n🚀 COMPLETE SETUP - Creating Everything\n');
  console.log('=' .repeat(60));

  try {
    // Connect to MongoDB
    console.log('\n[1] Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-tracker');
    console.log('✅ Connected to MongoDB Atlas');

    // Check/Create User
    console.log('\n[2] Setting up user account...');
    let user = await User.findOne({});

    if (!user) {
      console.log('   Creating test user...');
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = new User({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User',
      });
      await user.save();
      console.log('✅ Created user: test@example.com');
      console.log('   Password: password123');
    } else {
      console.log(`✅ Using existing user: ${user.email}`);
    }

    // Check/Create Subjects
    console.log('\n[3] Setting up subjects...');
    let subjects = await Subject.find({ user: user._id });

    if (subjects.length === 0) {
      console.log('   Creating sample subjects...');

      const sampleSubjects = [
        {
          user: user._id,
          name: 'Mathematics',
          color: '#3B82F6',
          classesPerWeek: 3,
          schedule: [
            { day: 'Mon', startTime: '09:00', endTime: '10:00' },
            { day: 'Wed', startTime: '09:00', endTime: '10:00' },
            { day: 'Fri', startTime: '09:00', endTime: '10:00' },
          ],
        },
        {
          user: user._id,
          name: 'Physics',
          color: '#10B981',
          classesPerWeek: 3,
          schedule: [
            { day: 'Mon', startTime: '10:00', endTime: '11:00' },
            { day: 'Wed', startTime: '10:00', endTime: '11:00' },
            { day: 'Fri', startTime: '10:00', endTime: '11:00' },
          ],
        },
        {
          user: user._id,
          name: 'Chemistry',
          color: '#F59E0B',
          classesPerWeek: 2,
          schedule: [
            { day: 'Tue', startTime: '11:00', endTime: '12:00' },
            { day: 'Thu', startTime: '11:00', endTime: '12:00' },
          ],
        },
      ];

      subjects = await Subject.insertMany(sampleSubjects);
      console.log(`✅ Created ${subjects.length} subjects`);
    } else {
      console.log(`✅ Using existing ${subjects.length} subjects`);
    }

    // Display subjects
    console.log('\n   📚 Subjects:');
    subjects.forEach(s => {
      console.log(`      ${s.name} (${s.schedule.length} classes/week):`);
      s.schedule.forEach(slot => {
        console.log(`         - ${slot.day}: ${slot.startTime}-${slot.endTime}`);
      });
    });

    // Generate Class Instances
    console.log('\n[4] Generating class instances for next 4 weeks...');
    for (const subject of subjects) {
      await generateClassInstances(subject, 4);
    }

    // Verify data
    console.log('\n[5] Verifying data...');
    const totalInstances = await ClassInstance.countDocuments({ user: user._id });
    const today = dayjs().startOf('day').toDate();
    const futureInstances = await ClassInstance.countDocuments({
      user: user._id,
      date: { $gte: today },
    });

    console.log(`   Total ClassInstances: ${totalInstances}`);
    console.log(`   Future ClassInstances: ${futureInstances}`);

    // Show sample week data
    console.log('\n[6] Sample of this week\'s classes:');
    const weekStart = dayjs().startOf('week').add(1, 'day').toDate();
    const weekEnd = dayjs().endOf('week').add(1, 'day').toDate();
    const weekClasses = await ClassInstance.find({
      user: user._id,
      date: { $gte: weekStart, $lte: weekEnd },
    }).populate('subject').limit(10).lean();

    if (weekClasses.length > 0) {
      weekClasses.forEach(cls => {
        const date = dayjs(cls.date).format('ddd MMM DD');
        console.log(`      ${date}: ${cls.subject?.name || 'Unknown'} ${cls.startTime}-${cls.endTime} [${cls.status}]`);
      });
    } else {
      console.log('      No classes this week (they might be next week)');
    }

    // Final summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 SETUP COMPLETE!');
    console.log('=' .repeat(60));
    console.log('\n✅ MongoDB Atlas: Connected');
    console.log(`✅ User: ${user.email}`);
    console.log(`✅ Password: password123`);
    console.log(`✅ Subjects: ${subjects.length}`);
    console.log(`✅ ClassInstances: ${totalInstances}`);
    console.log(`✅ Future Classes: ${futureInstances}`);

    console.log('\n📋 NEXT STEPS:');
    console.log('=' .repeat(60));
    console.log('1. Make sure backend is running:');
    console.log('   cd backend');
    console.log('   npm start');
    console.log('');
    console.log('2. Make sure frontend is running:');
    console.log('   cd frontend');
    console.log('   npm run dev');
    console.log('');
    console.log('3. Open browser: http://localhost:5173');
    console.log('');
    console.log('4. Login with:');
    console.log('   Email: test@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('5. Go to Dashboard');
    console.log('');
    console.log('6. ✅ Classes will appear in the calendar!');
    console.log('');
    console.log('If calendar is empty:');
    console.log('- Clear browser cache (Ctrl+Shift+Delete)');
    console.log('- Hard refresh (Ctrl+Shift+R)');
    console.log('- Check browser console for errors (F12)');
    console.log('');
    console.log('=' .repeat(60));

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

completeSetup();
