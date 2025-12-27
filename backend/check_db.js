const mongoose = require('mongoose');
require('dotenv').config();

const Subject = require('./src/models/Subject');
const ClassInstance = require('./src/models/ClassInstance');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-tracker');
    
    console.log('\n📚 SUBJECTS:');
    const subjects = await Subject.find({}).lean();
    console.log(`Total: ${subjects.length}`);
    subjects.forEach(s => {
      console.log(`  - ${s.name}: ${s.schedule?.length || 0} time slots`);
      s.schedule?.forEach(slot => {
        console.log(`    → ${slot.day} ${slot.startTime}-${slot.endTime}`);
      });
    });
    
    console.log('\n📅 CLASS INSTANCES:');
    const instances = await ClassInstance.find({}).lean();
    console.log(`Total: ${instances.length}`);
    if (instances.length > 0) {
      console.log('First 5:');
      instances.slice(0, 5).forEach(inst => {
        console.log(`  - ${inst.date} ${inst.startTime} [${inst.status}]`);
      });
    }
    
    await mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

check();
