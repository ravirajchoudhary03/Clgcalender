import api from './api';

export const assignmentService = {
    create: (title, subjectId, dueDate) => api.post('/assignments', { title, subjectId, dueDate }),
    list: () => api.get('/assignments'),
    update: (id, updates) => api.put(`/assignments/${id}`, updates)
};

export default assignmentService;
