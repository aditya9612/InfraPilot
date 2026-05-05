import api from "./api";
import type { 
    UserSettings, 
    UserProfile, 
    UpdateSettingsRequest, 
    UpdateProfileRequest 
} from "../types/settings";

export const settingsService = {
    /**
     * Get User Settings
     * GET /api/v1/settings
     */
    async getSettings(): Promise<UserSettings> {
        try {
            const response = await api.get("/settings");
            return response.data;
        } catch (error: any) {
            console.error("Get Settings API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update User Settings
     * PUT /api/v1/settings
     */
    async updateSettings(data: UpdateSettingsRequest): Promise<UserSettings> {
        try {
            const response = await api.put("/settings", data);
            return response.data;
        } catch (error: any) {
            console.error("Update Settings API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get User Profile
     * GET /api/v1/settings/profile
     */
    async getProfile(): Promise<UserProfile> {
        try {
            const response = await api.get("/settings/profile");
            return response.data;
        } catch (error: any) {
            console.error("Get Profile API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Update User Profile
     * PUT /api/v1/settings/profile
     */
    async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
        try {
            const response = await api.put("/settings/profile", data);
            return response.data;
        } catch (error: any) {
            console.error("Update Profile API Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
