const { getClient } = require('../config/supabase');

const getToken = (req) => req.headers.authorization;

exports.addSchedule = async (req, res) => {
  const { day, time, subjectId } = req.body;
  const supabase = getClient(getToken(req));

  try {
    if (!day || !time || !subjectId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const startTime = time;
    const [hours, minutes] = time.split(':').map(Number);
    const endHours = (hours + 1) % 24;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('weekly_schedule')
      .insert([
        {
          subject_id: subjectId,
          day,
          start_time: startTime,
          end_time: endTime
        }
      ])
      .select();

    if (error) throw error;

    res.status(201).json(data);
  } catch (err) {
    console.error('Add Schedule Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSchedule = async (req, res) => {
  // Basically return subjects with their weekly schedule
  const userId = req.user.id;
  const supabase = getClient(getToken(req));

  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*, weekly_schedule(*)')
      .eq('user_id', userId);

    if (error) throw error;

    // Transform to flat list of schedule items if needed, or return subjects
    // The original controller probably returned a list of time slots

    let schedule = [];
    subjects.forEach(sub => {
      if (sub.weekly_schedule) {
        sub.weekly_schedule.forEach(slot => {
          schedule.push({
            ...slot,
            subjectName: sub.name,
            color: sub.color
          });
        });
      }
    });

    res.json(schedule);
  } catch (err) {
    console.error('Get Schedule Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
