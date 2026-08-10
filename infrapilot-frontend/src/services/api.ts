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

    // ── Global Trailing Slash Enforcer ──────────────────────────────────────
    // The backend (Django/FastAPI) requires a trailing slash before query params.
    // Without it, server sends 307 redirect → browser drops the Authorization
    // header on redirect → 401 "Not authenticated".
    // This block ensures every request path ends with '/' before any '?' params.
    if (config.url) {
      const qIndex = config.url.indexOf('?');
      if (qIndex === -1) {
        // No query string — just ensure path ends with /
        if (!config.url.endsWith('/')) {
          config.url = `${config.url}/`;
        }
      } else {
        // Has query string — insert / between path and ?
        const path = config.url.substring(0, qIndex);
        const query = config.url.substring(qIndex);
        if (!path.endsWith('/')) {
          config.url = `${path}/${query}`;
        }
      }
    }
    // ────────────────────────────────────────────────────────────────────────

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
        url.includes("invoices") ||
        url.includes("communication") ||
        url.includes("alerts") ||
        url.includes("chats") ||
        url.includes("chat") ||
        url.includes("settings") ||
        url.includes("notifications") ||
        url.includes("dashboard") ||
        url.includes("billing") ||
        url.includes("contractors") ||
        url.includes("work-orders") ||
        url.includes("quotations") ||
        url.includes("measurements") ||
        url.includes("accountant/") ||
        url.includes("labour/payroll") ||
        url.includes("labour/attendance") ||
        url.includes("projects/module-summary") ||
        url.includes("health-score") ||
        url.includes("resource-summary");

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
