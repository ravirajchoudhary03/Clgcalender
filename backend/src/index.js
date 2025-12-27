// Entry point for the backend server
// Simple Express server that wires routes and connects to MongoDB via Mongoose

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Try to connect to DB, but don't crash if it fails
let dbConnected = false;
(async () => {
  try {
    const connectDB = require('./config/db');
    await connectDB();
    dbConnected = true;
  } catch (err) {
    console.warn('⚠️  MongoDB not available. Running in demo mode.');
    console.log('To use a database, update MONGO_URI in .env');
  }
})();

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.json({ 
  message: 'College Organizer Backend',
  status: dbConnected ? '✅ Database Connected' : '⚠️ Demo Mode (No Database)'
}));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
