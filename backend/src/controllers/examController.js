const { getClient } = require('../config/supabase');

const getToken = (req) => req.headers.authorization;

// Get all exams for user
exports.getExams = async (req, res) => {
    try {
        const supabase = getClient(getToken(req));
        const userId = req.user.id;
        const { data: exams, error } = await supabase
            .from('exams')
            .select('*, subject:subjects(name, color)')
            .eq('user_id', userId)
            .order('date', { ascending: true });

        if (error) throw error;
        res.json(exams);
    } catch (err) {
        console.error('Get Exams Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new exam
exports.createExam = async (req, res) => {
    const { title, subjectId, date, syllabus } = req.body;
    const userId = req.user.id;
    const supabase = getClient(getToken(req));

    if (!title || !date) {
        return res.status(400).json({ message: 'Title and Date are required' });
    }

    try {
        const { data: exam, error } = await supabase
            .from('exams')
            .insert([{
                user_id: userId,
                subject_id: subjectId || null,
                title,
                date,
                syllabus
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(exam);
    } catch (err) {
        console.error('Create Exam Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
