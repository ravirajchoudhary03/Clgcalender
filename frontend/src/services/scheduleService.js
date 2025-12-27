// Service layer for schedule endpoints
import api from './api';

export const scheduleService = {
  add: (day, time, subjectId) => api.post('/schedule', { day, time, subjectId }),
  list: () => api.get('/schedule'),
  getTodaysClasses: () => api.get('/schedule/today'),
  markClass: (scheduleId, date, status) => api.post('/schedule/today/mark', { scheduleId, date, status }),
  getSubjectAttendance: (subjectId) => api.get(`/schedule/subject/${subjectId}/attendance`)
};

export default scheduleService;
