import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  withCredentials: true, // Send HttpOnly auth cookie automatically
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Response interceptor — redirect to login on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear client state and redirect — full reload clears cache
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
