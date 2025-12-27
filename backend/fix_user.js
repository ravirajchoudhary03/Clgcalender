const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

async function fixUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const users = await User.find({});
    console.log(`Found ${users.length} users:\n`);
    
    users.forEach((u, i) => {
      console.log(`${i+1}. Email: ${u.email || 'N/A'}`);
      console.log(`   Name: ${u.name || 'N/A'}`);
      console.log(`   ID: ${u._id}`);
      console.log('');
    });

    // Update the first user's password
    if (users.length > 0) {
      const user = users[0];
      const newPassword = await bcrypt.hash('password123', 10);
      user.password = newPassword;
      await user.save();
      
      console.log('✅ Password reset!\n');
      console.log('Login with:');
      console.log(`Email: ${user.email}`);
      console.log('Password: password123');
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

fixUser();
