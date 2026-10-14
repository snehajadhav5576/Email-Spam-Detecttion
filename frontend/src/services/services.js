import api from './api';

export const authService = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
};

export const analysisService = {
  analyze: (data) => api.post('/api/analyses', data),
  getHistory: (params) => api.get('/api/analyses', { params }),
  getById: (id) => api.get(`/api/analyses/${id}`),
  delete: (id) => api.delete(`/api/analyses/${id}`),
};

export const analyticsService = {
  getSummary: () => api.get('/api/analytics/summary'),
  getTrends: (days) => api.get('/api/analytics/trends', { params: { days } }),
  getIndicators: (days) => api.get('/api/analytics/indicators', { params: { days } }),
};

export const profileService = {
  getProfile: () => api.get('/api/profile'),
  updateProfile: (data) => api.put('/api/profile', data),
  changePassword: (data) => api.put('/api/profile/password', data),
  deleteHistory: () => api.delete('/api/profile/history'),
};

export const adminService = {
  getDashboard: () => api.get('/api/admin/dashboard'),
  getUsers: (params) => api.get('/api/admin/users', { params }),
  toggleUserStatus: (id, active) => api.patch(`/api/admin/users/${id}/status`, null, { params: { active } }),
  getModelInfo: () => api.get('/api/admin/model-info'),
  getAuditLogs: (params) => api.get('/api/admin/audit-logs', { params }),
  getTrends: (days) => api.get('/api/admin/trends', { params: { days } }),
  getIndicators: (days) => api.get('/api/admin/indicators', { params: { days } }),
};
