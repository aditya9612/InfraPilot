import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL;
console.log("🛠️ API Base URL Initialized:", API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor for attaching tokens
api.interceptors.request.use(
  (config) => {
    const userString = localStorage.getItem("infrapilot_user");
    if (userString) {
      try {
        const user = JSON.parse(userString);
        const token = user.token?.access_token || user.token;
        if (token && typeof token === "string") {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error("Auth Interceptor: Failed to parse user object", e);
      }
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
      const userString = localStorage.getItem("infrapilot_user");
      if (userString) {
        try {
          const user = JSON.parse(userString);
          const token = user.token?.access_token || user.token;
          // Do NOT auto-logout mock users — they use static tokens
          if (
            token === "mock_test_token_client_transparency" ||
            token === "mock_accountant_token"
          ) {
            console.warn("Mock session received 401 — suppressing auto-logout.");
            return Promise.reject(error);
          }
        } catch (e) {
          // Ignore parse error
        }
      }
      
      // Clear storage and redirect to login
      localStorage.removeItem("infrapilot_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
