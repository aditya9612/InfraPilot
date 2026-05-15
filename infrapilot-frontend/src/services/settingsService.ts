import api from "./api";

export interface UserProfile {
  user_id?: number;
  full_name: string;
  email: string;
  mobile_number: string;
  role: string;
  address: string;
  pan_number?: string;
  aadhaar_number?: string;
  designation?: string;
  joining_date?: string;
  is_active?: boolean;
  profile_image?: string | null;
  company?: string; // Kept for backward compatibility if needed elsewhere
}

export interface GeneralSettings {
  language: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export const settingsService = {
  getProfile: async (): Promise<UserProfile> => {
    try {
      const response = await api.get("/settings/profile");
      return response.data;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const response = await api.put("/settings/profile", profileData);
      return response.data;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  getSettings: async (): Promise<GeneralSettings> => {
    try {
      const response = await api.get("/settings");
      return response.data;
    } catch (error) {
      console.error("Error fetching settings:", error);
      throw error;
    }
  },

  updatePassword: async (passwordData: any): Promise<any> => {
    try {
      const response = await api.put("/settings/password", passwordData);
      return response.data;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },
};
