const { getClient } = require('../config/supabase');

const getToken = (req) => req.headers.authorization;

// Get all assignments for user
exports.getAssignments = async (req, res) => {
    try {
        const supabase = getClient(getToken(req));
        const userId = req.user.id;
        const { data: assignments, error } = await supabase
            .from('assignments')
            .select('*, subject:subjects(name, color)')
            .eq('user_id', userId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        res.json(assignments);
    } catch (err) {
        console.error('Get Assignments Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create a new assignment
exports.createAssignment = async (req, res) => {
    const { title, subjectId, dueDate } = req.body;
    const userId = req.user.id;
    const supabase = getClient(getToken(req));

    if (!title || !dueDate) {
        return res.status(400).json({ message: 'Title and Due Date are required' });
    }

    try {
        const { data: assignment, error } = await supabase
            .from('assignments')
            .insert([{
                user_id: userId,
                subject_id: subjectId || null,
                title,
                due_date: dueDate
            }])
            .select()
            .single();

        if (error) throw error;
        res.json(assignment);
    } catch (err) {
        console.error('Create Assignment Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update assignment (e.g., mark as completed)
exports.updateAssignment = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;
    const supabase = getClient(getToken(req));

    try {
        const { data: assignment, error } = await supabase
            .from('assignments')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Security check
            .select()
            .single();

        if (error) throw error;
        res.json(assignment);
    } catch (err) {
        console.error('Update Assignment Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
