import api from './api';

export const examService = {
    create: (title, subjectId, date, syllabus) => api.post('/exams', { title, subjectId, date, syllabus }),
    list: () => api.get('/exams')
};

export default examService;
