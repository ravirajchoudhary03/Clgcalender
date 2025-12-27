// Quick Status Checker - Run this to see what's wrong
const mongoose = require('mongoose');
require('dotenv').config();

async function checkStatus() {
  console.log('\n🔍 QUICK STATUS CHECK');
  console.log('=' .repeat(50));

  // Check 1: MongoDB Connection
  console.log('\n[1] MongoDB Connection...');
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-tracker',
      { serverSelectionTimeoutMS: 5000 }
    );
    console.log('✅ MongoDB is running and connected');
  } catch (err) {
    console.log('❌ MongoDB is NOT running!');
    console.log('   Fix: Start MongoDB service');
    console.log('   Windows: services.msc → MongoDB → Start');
    console.log('   Command: net start MongoDB');
    process.exit(1);
  }

  // Check 2: Models
  console.log('\n[2] Loading models...');
  const Subject = require('./src/models/Subject');
  const ClassInstance = require('./src/models/ClassInstance');
  console.log('✅ Models loaded');

  // Check 3: Subjects
  console.log('\n[3] Checking Subjects...');
  const subjects = await Subject.find({}).lean();
  console.log(`   Total subjects: ${subjects.length}`);

  const subjectsWithSchedule = subjects.filter(s => s.schedule && s.schedule.length > 0);
  console.log(`   Subjects with schedules: ${subjectsWithSchedule.length}`);

  if (subjectsWithSchedule.length > 0) {
    console.log('\n   📚 Subjects:');
    subjectsWithSchedule.forEach(s => {
      console.log(`      - ${s.name} (${s.schedule.length} time slots)`);
    });
  } else {
    console.log('   ⚠️  No subjects have schedules!');
    console.log('   Action: Go to Schedule page and add schedule entries');
  }

  // Check 4: ClassInstances
  console.log('\n[4] Checking ClassInstances...');
  const totalInstances = await ClassInstance.countDocuments();
  console.log(`   Total ClassInstances: ${totalInstances}`);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureInstances = await ClassInstance.countDocuments({
    date: { $gte: today }
  });
  console.log(`   Future ClassInstances: ${futureInstances}`);

  // Check 5: Analysis
  console.log('\n[5] Analysis:');
  if (subjectsWithSchedule.length === 0) {
    console.log('   ❌ PROBLEM: No subjects with schedules');
    console.log('   FIX: Go to Schedule page, add schedule entries');
  } else if (futureInstances === 0) {
    console.log('   ❌ PROBLEM: Subjects exist but no ClassInstances');
    console.log('   FIX: Run regeneration:');
    console.log('        curl -X POST http://localhost:5000/api/schedule/regenerate \\');
    console.log('             -H "Authorization: Bearer YOUR_TOKEN"');
    console.log('   OR: Delete and re-add schedule entries on Schedule page');
  } else {
    console.log('   ✅ Everything looks good!');
    console.log('   Classes should appear on Dashboard');
  }

  // Check 6: Today's classes
  console.log('\n[6] Today\'s Classes:');
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayClasses = await ClassInstance.find({
    date: { $gte: today, $lt: tomorrow }
  }).populate('subject').lean();

  if (todayClasses.length > 0) {
    console.log(`   Found ${todayClasses.length} classes for today:`);
    todayClasses.forEach(cls => {
      console.log(`      - ${cls.subject?.name || 'Unknown'}: ${cls.startTime}-${cls.endTime} [${cls.status}]`);
    });
  } else {
    console.log('   No classes scheduled for today');
  }

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('SUMMARY:');
  console.log(`  Subjects: ${subjectsWithSchedule.length}`);
  console.log(`  ClassInstances: ${totalInstances}`);
  console.log(`  Future classes: ${futureInstances}`);

  if (subjectsWithSchedule.length > 0 && futureInstances > 0) {
    console.log('\n✅ System is working correctly!');
    console.log('   If Dashboard is empty:');
    console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   2. Hard refresh (Ctrl+Shift+R)');
    console.log('   3. Check browser console for errors (F12)');
  } else {
    console.log('\n⚠️  Action needed - see Analysis section above');
  }

  console.log('=' .repeat(50) + '\n');

  await mongoose.connection.close();
  process.exit(0);
}

checkStatus().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
