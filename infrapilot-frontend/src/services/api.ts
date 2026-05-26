import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor for attaching tokens
api.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem("infrapilot_user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        const token = user.token?.access_token || user.token;
        if (token && typeof token === 'string') {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn("Auth Interceptor: Token not found in user object", user);
        }
      } catch (e) {
        console.error("Auth Interceptor: Failed to parse user object", e);
      }
    } else {
      console.warn("Auth Interceptor: No user found in localStorage");
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Ignore 401s from known buggy or sensitive endpoints to prevent aggressive logouts
      const url = error.config?.url ?? '';
      const isIgnored =
        url.includes('/invoices') ||
        url.includes('/communication');

      if (isIgnored) {
        console.warn("Auth Interceptor: Ignoring 401 from endpoint to prevent logout:", url);
      } else {
        const path = window.location.pathname;
        // Don't redirect if we're already on the login page or root (which shows login)
        if (path !== '/login' && path !== '/') {
          localStorage.removeItem('infrapilot_user');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
