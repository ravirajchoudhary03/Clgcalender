// MongoDB connection helper

const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.warn('⚠️ MONGO_URI is not set in .env');
    return false;
  }

  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 2000, // Timeout after 2 seconds instead of 10
      bufferCommands: false, // Don't buffer commands if not connected
    });
    console.log('✅ MongoDB connected');
    return true;
  } catch (err) {
    console.warn('⚠️ MongoDB connection failed:', err.message);
    return false;
  }
};

module.exports = connectDB;
