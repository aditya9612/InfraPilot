import api from "./api";

export interface VerifyOtpResponse {
  token: {
    access_token: string;
    token_type: string;
  };
  user_id: number;
}

export interface LoginResponse {
  message: string;
  mobile: string;
}

// Dev-only mock credentials. Active ONLY when backend is unreachable (5xx / network error).
const ADMIN_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicm9sZSI6IkFkbWluIiwiZXhwIjoxNzc0OTU3Mzc2fQ.3Jrx1oIvOw3vgQL5ym_7I6Mo82ODDKHs_lUpNZvF74o";

const MOCK_USERS: Record<string, { token: string; userId: number; role: string; name: string }> = {
  "9999999990": { token: ADMIN_JWT,                              userId: 1,   role: "Admin",         name: "InfraPilot Admin" },
  "9696969696": { token: "mock_test_token_client_transparency",  userId: 999, role: "Client",        name: "InfraPilot Client" },
  "9999999991": { token: "mock_accountant_token",                userId: 100, role: "Accountant",    name: "InfraPilot Accountant" },
  "8464796527": { token: "mock_manager_token",                   userId: 500, role: "ProjectManager",name: "InfraPilot Project Manager" },
};

/**
 * Returns true when the backend is unreachable:
 *  - No response at all (ECONNREFUSED, timeout, network error)
 *  - 5xx response (502 Bad Gateway from Vite proxy, 503, 500, etc.)
 */
const isOfflineError = (error: any): boolean => {
  if (!error?.response) return true;
  return error.response.status >= 500;
};

export const authService = {
  /**
   * Step 1 — Request OTP
   * POST /api/v1/auth/login
   * Body:     { "mobile": "9696969696" }
   * Response: { "message": "OTP sent", "mobile": "9696969696" }
   */
  async login(mobile: string): Promise<LoginResponse> {
    try {
      const response = await api.post("/auth/login", { mobile });
      return response.data;
    } catch (error: any) {
      if (isOfflineError(error)) {
        console.warn(`[Auth] Backend offline (${error?.response?.status ?? "no response"}) — mock OTP flow for ${mobile}`);
        // Allow any valid 10-digit number to proceed with mock OTP when backend is down
        return { message: "OTP sent (offline mode)", mobile };
      }
      // Surface real backend errors (400 bad request, 404 not found, etc.) to the UI
      throw error;
    }
  },

  /**
   * Step 2 — Verify OTP
   * POST /api/v1/auth/verify_otp
   * Body:     { "mobile": "...", "otp": "..." }
   * Response: { token: { access_token, token_type }, user_id }
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    try {
      const response = await api.post("/auth/verify_otp", { mobile, otp });
      return response.data;
    } catch (error: any) {
      if (isOfflineError(error) && (otp === "123456" || otp === "186142")) {
        console.warn(`[Auth] Backend offline — mock OTP verification for ${mobile}`);
        // Use registered mock user config if available, otherwise default to Admin
        const mock = MOCK_USERS[mobile];
        return {
          token: {
            access_token: mock?.token ?? "mock_admin_token",
            token_type: "bearer",
          },
          user_id: mock?.userId ?? 1,
        };
      }
      throw error;
    }
  },

  /**
   * Step 3 — Fetch logged-in user profile
   * GET /api/v1/users/me
   */
  async getMe(mobile?: string): Promise<{
    full_name: string;
    role: string;
    email?: string;
    mobile_number?: string;
  }> {
    try {
      const response = await api.get("/users/me");
      return response.data;
    } catch (error: any) {
      const activeMobile =
        mobile || JSON.parse(localStorage.getItem("infrapilot_user") || "{}").mobile;

      if (isOfflineError(error)) {
        console.warn(`[Auth] Backend offline — mock profile for ${activeMobile}`);
        const mock = MOCK_USERS[activeMobile];
        // Known mock user → use their role; unknown → default to Admin
        return {
          full_name: mock?.name ?? "InfraPilot Admin",
          role: mock?.role ?? "Admin",
          mobile_number: activeMobile,
        };
      }

      throw error;
    }
  },

  /**
   * Update user profile
   * PUT /api/v1/settings/profile
   */
  async updateProfile(payload: {
    full_name: string;
    email?: string;
    mobile_number?: string;
    address?: string;
    pan_number?: string;
    aadhaar_number?: string;
    designation?: string;
    joining_date?: string;
    role?: string;
    is_active?: boolean;
  }): Promise<any> {
    const response = await api.put("/settings/profile", payload);
    return response.data;
  },

  /**
   * Fetch user profile
   * GET /api/v1/settings/profile
   */
  async getProfile(): Promise<any> {
    const response = await api.get("/settings/profile");
    return response.data;
  },

  logout() {
    localStorage.removeItem("infrapilot_user");
  },
};
