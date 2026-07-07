import axios from "axios";

// Ensure API_BASE_URL doesn't have double slashes when used with relative paths
export const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

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
        }
      } catch (e) {
        console.error("Auth Interceptor: Failed to parse user object", e);
      }
    }

    // Ensure the URL doesn't start with a slash if we want it to be relative to baseURL
    if (config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";

    // Handle 502 Bad Gateway and 504 Gateway Timeout
    if (status === 502 || status === 504) {
      console.warn(`Gateway Error (${status}) on ${url}. The server might be restarting or unstable.`);
      // We don't logout for gateway errors as they are often temporary backend issues
      return Promise.reject(error);
    }

    if (status === 401) {
      // Ignore 401s from known buggy or sensitive endpoints to prevent aggressive logouts
      const isIgnored =
        url.includes("/invoices") ||
        url.includes("/communication") ||
        url.includes("/alerts") ||
        url.includes("/projects/alerts") ||
        url.includes("/chats") ||
        url.includes("/chat") ||
        url.includes("/settings") ||
        url.includes("/notifications") ||
        url.includes("/dashboard");

      if (!isIgnored) {
        const path = window.location.pathname;
        // Don't logout if we're already on login or home
        if (path !== '/login' && path !== '/') {
          console.warn("Auth Interceptor: 401 Unauthorized. Redirecting to login...", url);
          localStorage.removeItem('infrapilot_user');
          window.location.href = '/login?expired=true';
        }
      } else {
        console.warn("Auth Interceptor: 401 for ignored endpoint, skipping logout:", url);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
