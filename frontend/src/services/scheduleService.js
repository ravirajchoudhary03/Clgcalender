// Service layer for schedule endpoints
import api from './api';

export const scheduleService = {
  add: (day, time, subjectId) => api.post('/schedule', { day, time, subjectId }),
  list: () => api.get('/schedule'),
  getTodaysClasses: () => api.get('/attendance/classes/today'),
  markClass: (classId, status) => api.post('/attendance/classes/update-status', { classId, status }),
  getSubjectAttendance: (subjectId) => api.get(`/attendance/subjects`)
};

export default scheduleService;
