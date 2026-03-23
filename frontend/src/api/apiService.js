import axios from 'axios';

/**
 * Axios API Service
 * - Base URL: VITE_API_URL env var in production, '/api' (Vite proxy) in dev
 * - JWT token automatically injected from localStorage on every request
 * - 401 responses auto-redirect to login (token expired)
 */

// In production set VITE_API_URL=https://your-render-app.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor: attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hostel_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hostel_token');
      localStorage.removeItem('hostel_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

// ─── Chat ────────────────────────────────────────
export const chatAPI = {
  sendMessage: (message) => api.post('/chat', { message }),
  getHistory: () => api.get('/chat/history'),
};

// ─── Upload ──────────────────────────────────────
export const uploadAPI = {
  uploadDocument: (file, documentType) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType || 'General');
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getDocuments: () => api.get('/upload/documents'),
};

// ─── Student ─────────────────────────────────────
export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getNotifications: () => api.get('/student/notifications'),
  markRead: (id) => api.put(`/student/notifications/${id}/read`),
};

// ─── Admin ───────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getStudents: (params) => api.get('/admin/students', { params }),
  getStudentById: (id) => api.get(`/admin/students/${id}`),
  updateStatus: (id, data) => api.put(`/admin/students/${id}/status`, data),
  sendNotification: (data) => api.post('/admin/notify', data),
};

export default api;
