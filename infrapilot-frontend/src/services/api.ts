import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://51.21.247.48/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor for attaching tokens
api.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem('infrapilot_user');
    if (userString) {
      const user = JSON.parse(userString);
      // Backend returns nested structure: { token: { access_token: "..." } }
      const token = user.token?.access_token || user.token; 
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // TEMPORARILY DISABLED: Clear session on authentication failure
      // localStorage.removeItem('infrapilot_user');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
