const { getClient } = require('../config/supabase');

// Helper to get token
const getToken = (req) => req.headers.authorization;

// Get habits for user
exports.getHabits = async (req, res) => {
  try {
    const token = getToken(req);
    console.log('DEBUG: User:', req.user);
    console.log('DEBUG: Token Length:', token ? token.length : 'null');
    console.log('DEBUG: Token Preview:', token ? token.substring(0, 20) + '...' : 'null');

    const supabase = getClient(token);
    const userId = req.user.id;
    const { data: habits, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(habits);
  } catch (err) {
    console.error('Get Habits Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// Create a habit (limit to 10 per user)
exports.createHabit = async (req, res) => {
  const { title, color } = req.body;
  const userId = req.user.id;

  console.log('DEBUG createHabit: Body:', req.body);
  console.log('DEBUG createHabit: User ID:', userId);

  const token = getToken(req);
  const supabase = getClient(token);

  try {
    // Check count
    const { count, error: countError } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    console.log('DEBUG: Count result:', { count, countError });

    if (countError) {
      console.error('Count Error Full:', JSON.stringify(countError, null, 2));
      throw countError;
    }
    if (count >= 10) return res.status(400).json({ message: 'Max 10 habits allowed' });

    // Insert
    const { data: habit, error: insertError } = await supabase
      .from('habits')
      .insert([{ user_id: userId, title, color }])
      .select()
      .single();

    console.log('DEBUG: Insert result:', { habit, insertError });

    if (insertError) {
      console.error('Insert Error Full:', JSON.stringify(insertError, null, 2));
      throw insertError;
    }
    return res.json(habit);
  } catch (err) {
    console.error('Create Habit Error:', err);
    console.error('Error Details:', JSON.stringify(err, null, 2));
    res.status(500).json({
      message: 'Server error',
      details: err.message || 'Unknown error',
      code: err.code,
      hint: err.hint
    });
  }
};

// Toggle or set completion for a date: create or update HabitLog
exports.markCompletion = async (req, res) => {
  const { habitId, date, completed } = req.body;
  const supabase = getClient(getToken(req));

  if (!habitId || !date || typeof completed !== 'boolean') return res.status(400).json({ message: 'Invalid payload' });

  try {
    // Upsert log
    const { data: log, error } = await supabase
      .from('habit_logs')
      .upsert({ habit_id: habitId, date, completed }, { onConflict: 'habit_id, date' })
      .select()
      .single();

    if (error) throw error;
    return res.json(log);
  } catch (err) {
    console.error('Mark Completion Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get completion percentages for a habit across a date range
exports.getCompletionStats = async (req, res) => {
  const { habitId, start, end } = req.query;
  const supabase = getClient(getToken(req));

  if (!habitId || !start || !end) return res.status(400).json({ message: 'Missing params' });

  try {
    // Get logs for this habit in range
    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('habit_id', habitId)
      .gte('date', start)
      .lte('date', end);

    if (error) throw error;

    const completed = logs.filter(l => l.completed).length;
    const totalDays = logs.length || 1;
    const percent = Math.round((completed / totalDays) * 100);

    return res.json({ habitId, percent, completed, totalDays });
  } catch (err) {
    console.error('Get Stats Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all logs for user in a date range (for dashboard graph)
exports.getLogs = async (req, res) => {
  const { start, end } = req.query;
  const userId = req.user.id;
  const supabase = getClient(getToken(req));

  if (!start || !end) return res.status(400).json({ message: 'Missing start/end params' });

  try {
    // Inner join with habits to filter by user_id
    const { data: logs, error } = await supabase
      .from('habit_logs')
      .select('*, habits!inner(user_id)')
      .eq('habits.user_id', userId)
      .gte('date', start)
      .lte('date', end);

    if (error) throw error;
    res.json(logs);
  } catch (err) {
    console.error('Get Logs Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
