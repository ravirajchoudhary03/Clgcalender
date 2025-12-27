const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./src/models/User');
const Subject = require('./src/models/Subject');
const ClassInstance = require('./src/models/ClassInstance');
const dayjs = require('dayjs');

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
  }
}

async function createData() {
  console.log('\n🔧 Creating data for ALL users...\n');
  
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users:\n`);

    for (const user of users) {
      console.log(`👤 User: ${user.email || user.name}`);
      
      let subjects = await Subject.find({ user: user._id });
      
      if (subjects.length === 0) {
        console.log('   Creating subjects...');
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
        console.log(`   ✅ Created ${subjects.length} subjects`);
      } else {
        console.log(`   ✅ Already has ${subjects.length} subjects`);
      }

      console.log('   Generating ClassInstances...');
      for (const subject of subjects) {
        await generateClassInstances(subject, 4);
      }
      
      const count = await ClassInstance.countDocuments({ user: user._id });
      console.log(`   ✅ Total ClassInstances: ${count}\n`);
    }

    console.log('🎉 Done! Refresh your Dashboard now.\n');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err);
    process.exit(1);
  }
}

createData();
