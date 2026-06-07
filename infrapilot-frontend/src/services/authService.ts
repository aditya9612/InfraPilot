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
    if (mobile === "8888888888") {
      return { message: "Mock OTP sent successfully (use 123456)", mobile };
    }
    const response = await api.post("/auth/login", { mobile });
    return response.data;
  },

  /**
   * Final Verify OTP request
   * POST /api/v1/auth/verify_otp
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    if (mobile === "8888888888" && otp === "123456") {
      return {
        token: { access_token: "mock-token-labour", token_type: "Bearer" },
        user_id: 999
      };
    }
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
    profile_image?: string | null;
  }> {
    try {
      const userString = localStorage.getItem("infrapilot_user");
      if (userString) {
        const user = JSON.parse(userString);
        if (user.mobile === "8888888888") {
          return {
            full_name: "Gopal Yadav",
            role: "Labour",
            email: "gopal.y@mock.com",
            mobile_number: "8888888888"
          };
        }
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage in getMe", e);
    }
    const response = await api.get("/users/me");
    return response.data;
  },

  logout() {
    localStorage.removeItem("infrapilot_user");
  },
};
