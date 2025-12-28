const { getClient } = require('../config/supabase');
const dayjs = require('dayjs');

const getToken = (req) => req.headers.authorization;

exports.seedData = async (req, res) => {
    const userId = req.user.id;
    const supabase = getClient(getToken(req));

    try {
        // 1. Get a subject to link to (optional)
        const { data: subjects } = await supabase
            .from('subjects')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        const subjectId = subjects && subjects.length > 0 ? subjects[0].id : null;

        // 2. Create Assignments
        const assignments = [
            {
                user_id: userId,
                subject_id: subjectId,
                title: 'Test Assignment 1 (Due Tomorrow)',
                due_date: dayjs().add(1, 'day').toISOString(),
                completed: false
            },
            {
                user_id: userId,
                subject_id: subjectId,
                title: 'Test Assignment 2 (Overdue)',
                due_date: dayjs().subtract(1, 'day').toISOString(),
                completed: false
            },
            {
                user_id: userId,
                subject_id: subjectId,
                title: 'Completed Task',
                due_date: dayjs().add(2, 'day').toISOString(),
                completed: true
            }
        ];

        await supabase.from('assignments').insert(assignments);

        // 3. Create Exams
        const exams = [
            {
                user_id: userId,
                subject_id: subjectId,
                title: 'Mid-Term Exam',
                date: dayjs().add(5, 'days').toISOString(),
                syllabus: 'Unit 1, 2 and 3'
            }
        ];

        await supabase.from('exams').insert(exams);

        res.json({ message: 'Seeding successful! Reload dashboard.' });
    } catch (err) {
        console.error('Seed Error:', err);
        res.status(500).json({ message: 'Seed failed', error: err.message });
    }
};
