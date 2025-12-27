// Service layer for habits endpoints
import api from './api';

export const habitService = {
  create: (title, color) => api.post('/habits', { title, color }),
  list: () => api.get('/habits'),
  markCompletion: (habitId, date, completed) => api.post('/habits/log', { habitId, date, completed }),
  getStats: (habitId, start, end) => api.get('/habits/stats', { params: { habitId, start, end } })
};

export default habitService;
