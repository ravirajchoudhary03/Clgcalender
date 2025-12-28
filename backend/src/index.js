// Entry point for the backend server
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

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/schedule', require('./routes/schedule'));
app.use('/api/users', require('./routes/users'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/exams', require('./routes/exams'));
app.use('/api/seed', require('./routes/seed'));

app.get('/', (req, res) => res.json({
  message: 'College Organizer Backend (Supabase)',
  status: '✅ Connected to Supabase'
}));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
