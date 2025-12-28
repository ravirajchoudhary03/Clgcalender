const supabase = require('../config/supabase');

// Get habits for user
exports.getHabits = async (req, res) => {
  try {
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
    res.status(500).json({ message: 'Server error' });
  }
};

// Create a habit (limit to 10 per user)
exports.createHabit = async (req, res) => {
  const { title, color } = req.body;
  const userId = req.user.id;

  try {
    // Check count
    const { count, error: countError } = await supabase
      .from('habits')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;
    if (count >= 10) return res.status(400).json({ message: 'Max 10 habits allowed' });

    // Insert
    const { data: habit, error: insertError } = await supabase
      .from('habits')
      .insert([{ user_id: userId, title, color }])
      .select()
      .single();

    if (insertError) throw insertError;
    return res.json(habit);
  } catch (err) {
    console.error('Create Habit Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Toggle or set completion for a date: create or update HabitLog
exports.markCompletion = async (req, res) => {
  const { habitId, date, completed } = req.body;
  const userId = req.user.id;
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
    // Note: This simple calculation divides by range length, but logic might need adjustment if date range is dynamic
    // For now assuming start/end defines the "total days" window or we just count logs?
    // The previous logic took logs.length || 1, which implies it only counts days that have a log entry?
    // Let's stick to the previous logical behavior: percent of LOGGED days that are completed.

    // Correction based on previous code: 
    // const totalDays = logs.length || 1;
    // const percent = Math.round((completed / totalDays) * 100);

    const totalDays = logs.length || 1;
    const percent = Math.round((completed / totalDays) * 100);

    return res.json({ habitId, percent, completed, totalDays });
  } catch (err) {
    console.error('Get Stats Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
