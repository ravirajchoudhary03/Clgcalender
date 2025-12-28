const supabase = require('../config/supabase');
const attendanceController = require('./attendanceController');

// Helper to determine end time if not provided or just simple logic
const calculateEndTime = (startTime) => {
  const [h, m] = startTime.split(':');
  const endH = (parseInt(h) + 1) % 24;
  return `${endH.toString().padStart(2, '0')}:${m}`;
};

exports.addSchedule = async (req, res) => {
  const { day, time, subjectId } = req.body;

  if (!day || !time || !subjectId) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const endTime = calculateEndTime(time);

    // Check if subject belongs to user
    const { data: subject, error: subErr } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('user_id', req.user.id)
      .single();

    if (subErr || !subject) return res.status(404).json({ message: 'Subject not found' });

    // Insert schedule
    const { data: sched, error: insertErr } = await supabase
      .from('weekly_schedule')
      .insert([{ subject_id: subjectId, day, start_time: time, end_time: endTime }])
      .select()
      .single();

    if (insertErr) throw insertErr;

    return res.json({
      message: "Schedule added successfully",
      subject,
      scheduleEntry: { day, startTime: time, endTime }
    });

  } catch (err) {
    console.error('Add Schedule Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const { data: subjects, error } = await supabase
      .from('subjects')
      .select('*, weekly_schedule(*)')
      .eq('user_id', req.user.id);

    if (error) throw error;

    const entries = [];
    subjects.forEach(sub => {
      const scheds = sub.weekly_schedule || [];
      scheds.forEach(s => {
        entries.push({
          _id: `${sub.id}_${s.day}_${s.start_time}`,
          day: s.day,
          time: s.start_time,
          endTime: s.end_time,
          subject: sub,
          subjectId: sub.id
        });
      });
    });

    res.json(entries);
  } catch (err) {
    console.error('Get Schedule Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Proxies to Attendance Controller Logic
exports.getTodaysClasses = (req, res) => {
  return attendanceController.getTodaysClasses(req, res);
};

exports.markTodayClass = (req, res) => {
  req.body.classId = req.body.scheduleId;
  return attendanceController.updateClassStatus(req, res);
};

exports.regenerateAllSchedules = (req, res) => {
  return res.json({ message: "Schedules regenerated (Dynamic Mode)" });
};

exports.getSubjectAttendance = async (req, res) => {
  // We can reuse listSubjects logic but filter for one?
  // Or just implement simplified fetch.
  const { subjectId } = req.params;
  try {
    const { data: subject, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !subject) return res.status(404).json({ message: "Subject not found" });

    // Fetch logs
    const { data: logs } = await supabase
      .from('attendance_logs')
      .select('status')
      .eq('subject_id', subjectId);

    const attended = logs.filter(l => l.status === 'attended').length;
    const missed = logs.filter(l => l.status === 'missed').length;
    const total = attended + missed;
    const percent = total === 0 ? 0 : Math.round((attended / total) * 100);

    let statusColor = 'red';
    if (percent >= 75) statusColor = 'green';
    else if (percent >= 65) statusColor = 'yellow';

    return res.json({
      ...subject,
      percent,
      status: statusColor,
      classesAttended: attended,
      totalClasses: total
    });
  } catch (err) {
    console.error('Get Subject Attendance Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
