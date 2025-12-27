const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./src/models/User');
const Subject = require('./src/models/Subject');

async function findJohn() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const john = await User.findOne({ $or: [
    { name: /john/i },
    { email: /john/i }
  ]});
  
  if (john) {
    console.log('Found John!');
    console.log('Email:', john.email);
    console.log('Name:', john.name);
    console.log('ID:', john._id);
    
    const subjects = await Subject.find({ user: john._id });
    console.log('Subjects:', subjects.length);
  } else {
    console.log('No John found');
    console.log('\nAll users:');
    const all = await User.find({});
    all.forEach(u => console.log(' -', u.email, '/', u.name));
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

findJohn();
