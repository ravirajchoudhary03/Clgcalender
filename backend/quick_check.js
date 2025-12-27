const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance-tracker')
  .then(async () => {
    const Subject = require('./src/models/Subject');
    const ClassInstance = require('./src/models/ClassInstance');
    
    const subjects = await Subject.countDocuments();
    const instances = await ClassInstance.countDocuments();
    const today = new Date();
    today.setHours(0,0,0,0);
    const future = await ClassInstance.countDocuments({ date: { $gte: today } });
    
    console.log('Subjects:', subjects);
    console.log('ClassInstances:', instances);
    console.log('Future ClassInstances:', future);
    
    if (subjects > 0 && future === 0) {
      console.log('\nPROBLEM: Subjects exist but no ClassInstances!');
      console.log('Need to regenerate.');
    } else if (future > 0) {
      console.log('\nData looks good!');
      const sample = await ClassInstance.find({ date: { $gte: today } }).limit(3).populate('subject');
      sample.forEach(c => {
        console.log(`  - ${c.date.toDateString()} ${c.startTime} ${c.subject?.name}`);
      });
    }
    
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.log('MongoDB NOT running!');
    console.log('Error:', err.message);
    process.exit(1);
  });
