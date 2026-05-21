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

export const authService = {
  /**
   * Sending OTP request
   * POST /api/v1/auth/login
   */
  async login(mobile: string): Promise<LoginResponse> {
    const response = await api.post("/auth/login", { mobile });
    return response.data;
  },

  /**
   * Final Verify OTP request
   * POST /api/v1/auth/verify_otp
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    const response = await api.post("/auth/verify_otp", { mobile, otp });
    return response.data;
  },

  /**
   * Fetching the full user profile after verification
   * GET /api/v1/users/me
   */
  async getMe(): Promise<{
    full_name: string;
    role: string;
    email?: string;
    mobile_number?: string;
  }> {
    const response = await api.get("/users/me");
    return response.data;
  },

  logout() {
    localStorage.removeItem("infrapilot_user");
  },
};
