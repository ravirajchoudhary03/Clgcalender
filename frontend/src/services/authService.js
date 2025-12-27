// Service layer for auth endpoints
import api from './api';

export const authService = {
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  getMe: () => api.get('/users/me')
};

export default authService;
