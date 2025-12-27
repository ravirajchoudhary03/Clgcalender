// Seed script: populate database with example user and test data
// Run: npm run seed

const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

dotenv.config();

const User = require('../src/models/User');
const Habit = require('../src/models/Habit');
const HabitLog = require('../src/models/HabitLog');
const Subject = require('../src/models/Subject');
const AttendanceLog = require('../src/models/AttendanceLog');
const WeeklySchedule = require('../src/models/WeeklySchedule');

const connect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Connection failed', err);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing
    await User.deleteMany({});
    await Habit.deleteMany({});
    await HabitLog.deleteMany({});
    await Subject.deleteMany({});
    await AttendanceLog.deleteMany({});
    await WeeklySchedule.deleteMany({});

    // Create user
    const salt = await bcrypt.genSalt(10);
    const user = new User({
      name: 'John Doe',
      email: 'student@example.com',
      password: await bcrypt.hash('password123', salt)
    });
    await user.save();
    console.log('User created');

    // Create habits
    const habits = [
      { user: user._id, title: 'Attend class', color: '#60A5FA' },
      { user: user._id, title: 'Study 2 hrs', color: '#34D399' },
      { user: user._id, title: 'Workout', color: '#F87171' }
    ];
    const savedHabits = await Habit.insertMany(habits);
    console.log('Habits created');

    // Create habit logs (example for last 7 days)
    const dayjs = require('dayjs');
    const today = dayjs();
    for (let i = 0; i < 7; i++) {
      const date = today.subtract(i, 'day').format('YYYY-MM-DD');
      for (const habit of savedHabits) {
        await HabitLog.create({
          user: user._id,
          habit: habit._id,
          date,
          completed: Math.random() > 0.4 // 60% completion
        });
      }
    }
    console.log('Habit logs created');

    // Create subjects
    const subjects = [
      { user: user._id, name: 'Data Structures', totalClasses: 20, classesAttended: 18, color: '#60A5FA' },
      { user: user._id, name: 'Web Development', totalClasses: 15, classesAttended: 14, color: '#34D399' },
      { user: user._id, name: 'Database Design', totalClasses: 10, classesAttended: 6, color: '#F87171' }
    ];
    const savedSubjects = await Subject.insertMany(subjects);
    console.log('Subjects created');

    // Create attendance logs
    for (const subject of savedSubjects) {
      for (let i = 0; i < subject.totalClasses; i++) {
        const date = today.subtract(i, 'day').format('YYYY-MM-DD');
        const status = Math.random() > 0.15 ? 'attended' : 'missed'; // 85% attended
        await AttendanceLog.create({
          user: user._id,
          subject: subject._id,
          date,
          status
        });
      }
    }
    console.log('Attendance logs created');

    // Create weekly schedule
    const dayMap = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const scheduleEntries = [
      { user: user._id, day: 'Mon', time: '09:00', subject: savedSubjects[0]._id },
      { user: user._id, day: 'Mon', time: '11:00', subject: savedSubjects[1]._id },
      { user: user._id, day: 'Wed', time: '10:00', subject: savedSubjects[2]._id },
      { user: user._id, day: 'Fri', time: '14:00', subject: savedSubjects[0]._id }
    ];
    await WeeklySchedule.insertMany(scheduleEntries);
    console.log('Weekly schedule created');

    console.log('Seed complete. Test credentials: student@example.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
};

(async () => {
  await connect();
  await seedData();
})();
