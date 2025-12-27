const Habit = require('../models/Habit');
const HabitLog = require('../models/HabitLog');
const mockDb = require('../config/mockDb');

// Helper to check if using mock data
const useMockDb = () => {
  try {
    // If this throws, MongoDB is not available
    return false;
  } catch {
    return true;
  }
};

// Get habits for user
exports.getHabits = async (req, res) => {
  try {
    const userId = req.user._id;

    // Try MongoDB first
    try {
      const habits = await Habit.find({ user: userId }).lean();
      return res.json(habits);
    } catch (err) {
      // Fall back to mock data
      const userHabits = Object.values(mockDb.habits).filter(h => h.user_id.toString() === userId.toString());
      return res.json(userHabits);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a habit (limit to 10 per user)
exports.createHabit = async (req, res) => {
  const { title, color } = req.body;
  const userId = req.user._id;

  try {
    try {
      const count = await Habit.countDocuments({ user: userId });
      if (count >= 10) return res.status(400).json({ message: 'Max 10 habits allowed' });

      const habit = new Habit({ user: userId, title, color });
      await habit.save();
      return res.json(habit);
    } catch (err) {
      // Use mock data
      const userHabits = Object.values(mockDb.habits).filter(h => h.user_id.toString() === userId.toString());
      if (userHabits.length >= 10) return res.status(400).json({ message: 'Max 10 habits allowed' });

      const id = mockDb.nextId.habits++;
      const habit = { _id: String(id), user_id: userId.toString(), title, color, createdAt: new Date() };
      mockDb.habits[id] = habit;
      return res.json(habit);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle or set completion for a date: create or update HabitLog
exports.markCompletion = async (req, res) => {
  const { habitId, date, completed } = req.body;
  const userId = req.user._id;
  if (!habitId || !date || typeof completed !== 'boolean') return res.status(400).json({ message: 'Invalid payload' });

  try {
    try {
      const log = await HabitLog.findOneAndUpdate(
        { user: userId, habit: habitId, date },
        { completed },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      return res.json(log);
    } catch (err) {
      // Use mock data
      const key = `${userId}-${habitId}-${date}`;
      const id = mockDb.nextId.habitLogs++;
      const log = { _id: String(id), user_id: userId, habit_id: habitId, date, completed };
      mockDb.habitLogs[id] = log;
      return res.json(log);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get completion percentages for a habit across a date range
exports.getCompletionStats = async (req, res) => {
  const { habitId, start, end } = req.query;
  if (!habitId || !start || !end) return res.status(400).json({ message: 'Missing params' });

  try {
    try {
      const logs = await HabitLog.find({ habit: habitId, date: { $gte: start, $lte: end } }).lean();
      const completed = logs.filter(l => l.completed).length;
      const totalDays = logs.length || 1;
      const percent = Math.round((completed / totalDays) * 100);
      return res.json({ habitId, percent, completed, totalDays });
    } catch (err) {
      // Use mock data
      const logs = Object.values(mockDb.habitLogs).filter(l => l.habit_id === habitId && l.date >= start && l.date <= end);
      const completed = logs.filter(l => l.completed).length;
      const totalDays = logs.length || 1;
      const percent = Math.round((completed / totalDays) * 100);
      return res.json({ habitId, percent, completed, totalDays });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};
