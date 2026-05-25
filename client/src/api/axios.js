import axios from 'axios';

const api = axios.create({
  baseURL: '/api', // Proxied to http://localhost:5000/api via vite.config.js
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('krishi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally — log out user if token is invalid
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('krishi_token');
      localStorage.removeItem('krishi_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;