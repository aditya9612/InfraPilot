import api from './api';
import type { User } from '../context/AuthContext';

export interface VerifyOtpResponse {
  token: {
    access_token: string;
    token_type: string;
  };
  user_id: number;
}

export const authService = {
  /**
   * Sending OTP request
   * MOCK: Always succeeds
   */
  async login(mobile: string) {
    console.log('MOCK LOGIN: Sending OTP to', mobile);
    return { status: 'success', message: 'MOCK: OTP sent successfully' };
  },

  /**
   * Final Verify OTP request
   * MOCK: Always succeeds with a mock token
   */
  async verifyOtp(mobile: string, otp: string): Promise<VerifyOtpResponse> {
    console.log('MOCK VERIFY: Verifying OTP', otp, 'for', mobile);
    return {
      token: {
        access_token: 'mock-access-token',
        token_type: 'Bearer',
      },
      user_id: 1,
    };
  },

  /**
   * Fetching the full user profile after verification
   * MOCK: Returns a profile based on the mobile number last digit
   */
  async getMe(): Promise<{ full_name: string; role: string; email?: string; mobile_number?: string }> {
    const userString = localStorage.getItem('infrapilot_user');
    const user = userString ? JSON.parse(userString) : null;
    const mobile = user?.mobile || '0000000000';
    
    let role = 'Admin';
    if (mobile === '9999999999') role = 'Admin';
    else if (mobile.endsWith('1')) role = 'Project Manager';
    else if (mobile.endsWith('2')) role = 'Site Engineer';
    else if (mobile.endsWith('3')) role = 'Contractor';
    else if (mobile.endsWith('4')) role = 'Accountant';
    else if (mobile.endsWith('5')) role = 'Client';
    else role = 'Admin'; // Default

    return {
      full_name: `Mock ${role}`,
      role: role,
      email: `${role.toLowerCase().replace(' ', '.')}@infrapilot.ai`,
      mobile_number: mobile,
    };
  },

  logout() {
    localStorage.removeItem('infrapilot_user');
  }
};
