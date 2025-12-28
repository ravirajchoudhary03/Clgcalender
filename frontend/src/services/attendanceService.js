// Service layer for attendance endpoints
import api from "./api";

export const attendanceService = {
  // Subject management
  createSubject: (name, color, classesPerWeek, schedule) =>
    api.post("/attendance/subject", { name, color, classesPerWeek, schedule }),

  listSubjects: () => api.get("/attendance/subjects"),
  deleteSubject: (id) => api.delete(`/attendance/subject/${id}`),

  // Legacy attendance logging
  logAttendance: (subjectId, date, status) =>
    api.post("/attendance/log", { subjectId, date, status }),

  // Class instance management
  getTodaysClasses: () => api.get("/attendance/classes/today"),

  getWeekClasses: (weekOffset) =>
    api.get("/attendance/classes/week", { params: { weekOffset } }),

  getClassInstances: (startDate, endDate) =>
    api.get("/attendance/classes", { params: { startDate, endDate } }),

  updateClassStatus: (classId, status) =>
    api.post("/attendance/classes/update-status", { classId, status }),

  regenerateSchedule: (subjectId) =>
    api.post(`/attendance/classes/regenerate/${subjectId}`),
};

export default attendanceService;
