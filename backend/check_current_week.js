const mongoose = require('mongoose');
const dayjs = require('dayjs');
require('dotenv').config();

const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ClassInstance = require('./src/models/ClassInstance');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const user = await User.findOne({});
  console.log('User:', user.email);
  console.log('User ID:', user._id);
  console.log('');
  
  const subjects = await Subject.find({ user: user._id });
  console.log(`Subjects: ${subjects.length}`);
  subjects.forEach(s => {
    console.log(`  - ${s.name}: ${s.schedule.length} slots`);
  });
  console.log('');
  
  const today = dayjs();
  console.log('Today:', today.format('YYYY-MM-DD dddd'));
  console.log('');
  
  // Check this week (Monday to Sunday)
  const weekStart = today.startOf('week').add(1, 'day').toDate();
  const weekEnd = today.endOf('week').add(1, 'day').toDate();
  
  console.log('Week range:');
  console.log('  Start:', dayjs(weekStart).format('YYYY-MM-DD dddd'));
  console.log('  End:', dayjs(weekEnd).format('YYYY-MM-DD dddd'));
  console.log('');
  
  const weekClasses = await ClassInstance.find({
    user: user._id,
    date: { $gte: weekStart, $lte: weekEnd }
  }).populate('subject').sort({ date: 1 });
  
  console.log(`Classes this week: ${weekClasses.length}`);
  weekClasses.forEach(cls => {
    console.log(`  ${dayjs(cls.date).format('ddd MMM DD')}: ${cls.subject?.name} ${cls.startTime}-${cls.endTime} [${cls.status}]`);
  });
  console.log('');
  
  // Check ALL future classes
  const allFuture = await ClassInstance.find({
    user: user._id,
    date: { $gte: new Date() }
  }).sort({ date: 1 }).limit(10);
  
  console.log(`Next 10 future classes:`);
  allFuture.forEach(cls => {
    console.log(`  ${dayjs(cls.date).format('YYYY-MM-DD ddd')}: ${cls.startTime}`);
  });
  
  await mongoose.connection.close();
  process.exit(0);
}

check();
