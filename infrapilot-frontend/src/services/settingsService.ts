import api from "./api";
import type {
    UserSettings,
    UserProfile,
    UpdateSettingsRequest,
    UpdateProfileRequest
} from "../types/settings";

export const settingsService = {
    /**
     * Helper to prefix relative paths for profile images
     */
    resolveUrl(path: string | null): string | null {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;

        let baseUrl = import.meta.env.VITE_API_URL || '';
        // If it's a relative path from the backend like /uploads/...
        if (path.startsWith('/uploads') || path.startsWith('uploads')) {
            try {
                // Remove /api/v1 suffix to get the root for file access
                const url = new URL(baseUrl);
                baseUrl = url.origin;
            } catch (e) {
                baseUrl = baseUrl.replace(/\/api\/v1\/?$/, '');
            }
        }

        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${baseUrl}${cleanPath}`;
    },

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
        console.log("PUT /api/v1/settings - Payload:", data);

        // Ensure numeric types are correct
        const payload = {
            ...data,
            default_project_id: data.default_project_id ? Number(data.default_project_id) : null
        };

        try {
            const response = await api.put("/settings", payload);
            return response.data;
        } catch (error: any) {
            console.error("Settings Update Failed:", error.response?.data || error.message);
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
            console.log("PUT /api/v1/settings/profile - Initiating Update", data);

            let response;
            if (data.profile_image instanceof File) {
                const formData = new FormData();
                formData.append("profile_image", data.profile_image);

                // Append all other fields
                if (data.full_name) formData.append("full_name", data.full_name);
                if (data.role) formData.append("role", data.role);
                if (data.mobile_number) formData.append("mobile_number", data.mobile_number);
                if (data.email) formData.append("email", data.email);
                if (data.address) formData.append("address", data.address);
                if (data.pan_number) formData.append("pan_number", data.pan_number);
                if (data.aadhaar_number) formData.append("aadhaar_number", data.aadhaar_number);
                if (data.designation) formData.append("designation", data.designation);
                if (data.joining_date) formData.append("joining_date", data.joining_date);
                if (data.is_active !== undefined) formData.append("is_active", String(data.is_active));

                // Note: We don't manually set Content-Type header to let Axios handle the boundary correctly
                response = await api.put("/settings/profile", formData);
            } else {
                // Standard JSON body
                const bodyData = { ...data };
                delete bodyData.profile_image;
                response = await api.put("/settings/profile", bodyData);
            }

            console.log("PUT /api/v1/settings/profile - SUCCESS:", response.data);
            return response.data;
        } catch (error: any) {
            console.error("Profile Update Failed:", error.response?.data || error.message);
            throw error;
        }
    }
};
