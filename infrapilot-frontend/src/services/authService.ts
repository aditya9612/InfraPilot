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
    // MOCK OTP SEND FOR DEVELOPMENT
    if (mobile === "4444444444" || mobile === "9999999991") {
      return {
        message: "OTP sent successfully (MOCK)",
        mobile: mobile
      };
    }

    const response = await api.post("/auth/login", { mobile });
    return response.data;
  },

  /**
   * Final Verify OTP request
   * POST /api/v1/auth/verify_otp
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    // MOCK LOGIN FOR DEVELOPMENT
    if ((mobile === "4444444444" || mobile === "9999999991") && otp === "123456") {
      return {
        token: {
          access_token: mobile === "9999999991" ? "mock_accountant_token" : "mock_test_token_client_transparency",
          token_type: "bearer"
        },
        user_id: mobile === "9999999991" ? 100 : 999
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
  }> {
    // MOCK PROFILE FOR DEVELOPMENT
    const stored = localStorage.getItem("infrapilot_user");
    if (stored) {
      const user = JSON.parse(stored);
      if (user.mobile === "4444444444") {
        return {
          full_name: "InfraPilot Client",
          role: "Client",
          mobile_number: "4444444444"
        };
      }
      if (user.mobile === "9999999991") {
        return {
          full_name: "InfraPilot Accountant",
          role: "Accountant",
          mobile_number: "9999999991"
        };
      }
    }

    const response = await api.get("/users/me");
    return response.data;
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
    // MOCK UPDATE FOR DEVELOPMENT
    if (isMockUser()) {
       console.log("Mock Settings Profile Update:", payload);
       return { message: "Profile updated successfully (MOCK)", ...payload };
    }

    const response = await api.put("/settings/profile", payload);
    return response.data;
  },

  /**
   * Fetch user profile
   * GET /api/v1/settings/profile
   */
  async getProfile(): Promise<any> {
    // MOCK PROFILE FOR DEVELOPMENT
    if (isMockUser()) {
       return {
          user_id: 1,
          full_name: "Admin User",
          role: "Admin",
          mobile_number: "9999999990",
          email: "admin@test.com",
          address: "Pune",
          pan_number: "ABCDE1234F",
          aadhaar_number: "123412341234",
          profile_image: "/uploads/profile/c5229e6d-19bf-4a3a-a977-9f5e89a51011.png",
          designation: "Admin",
          joining_date: "2026-03-30",
          is_active: true
       };
    }

    const response = await api.get("/settings/profile");
    return response.data;
  },

  logout() {
    localStorage.removeItem("infrapilot_user");
  },
};

// Helper to check if the current user is the mock/dev client
const isMockUser = () => {
  try {
    const stored = localStorage.getItem("infrapilot_user");
    if (!stored) return false;
    const user = JSON.parse(stored);
    const token = user.token?.access_token || user.token;
    return token === 'mock_test_token_client_transparency' || token === 'mock_accountant_token';
  } catch {
    return false;
  }
};
