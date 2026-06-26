import api from "./api";
import type {
    UserSettings,
    UserProfile,
    UpdateSettingsRequest,
    UpdateProfileRequest,
    CompanySettings,
    UpdateCompanySettings
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
            const apiSettings = response.data;

            const lastSavedAt = localStorage.getItem("mock_settings_saved_at");
            const localSettings = localStorage.getItem("mock_settings");
            if (lastSavedAt && localSettings) {
                const savedMs = parseInt(lastSavedAt, 10);
                const ageSeconds = (Date.now() - savedMs) / 1000;
                if (ageSeconds < 5) {
                    console.log("getSettings: Using locally saved settings (saved", Math.round(ageSeconds), "s ago)");
                    return JSON.parse(localSettings);
                }
            }

            localStorage.setItem("mock_settings", JSON.stringify(apiSettings));
            localStorage.removeItem("mock_settings_saved_at");
            return apiSettings;
        } catch (error: any) {
            console.error("Get Settings API Error:", error.message);
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
            if (payload.default_project_id !== null && payload.default_project_id !== undefined) {
                localStorage.setItem("client_selected_project_id", payload.default_project_id.toString());
            }
            // Ensure we save the user's choice locally immediately with high priority
            const finalData = { ...response.data, default_project_id: payload.default_project_id };
            localStorage.setItem("mock_settings", JSON.stringify(finalData));
            localStorage.setItem("mock_settings_saved_at", Date.now().toString());
            return finalData;
        } catch (error: any) {
            console.error("Settings Update Failed:", error.message);
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
            const apiProfile = response.data;

            // Check if we saved a profile locally more recently than what the API returned.
            // This handles the case where PUT succeeds but GET still returns stale data (backend caching).
            const lastSavedAt = localStorage.getItem("mock_profile_saved_at");
            const localProfile = localStorage.getItem("mock_profile");
            if (lastSavedAt && localProfile) {
                const savedMs = parseInt(lastSavedAt, 10);
                const ageSeconds = (Date.now() - savedMs) / 1000;
                if (ageSeconds < 300) {
                    // Local save is fresh — prefer it and return early
                    console.log("getProfile: Using locally saved profile (saved", Math.round(ageSeconds), "s ago)");
                    return JSON.parse(localProfile);
                }
            }

            // API data seems current — use it and clear our local override
            localStorage.setItem("mock_profile", JSON.stringify(apiProfile));
            localStorage.removeItem("mock_profile_saved_at");
            return apiProfile;
        } catch (error: any) {
            console.error("Get Profile API Error:", error.message);
            throw error;
        }
    },

    /**
     * Update User Profile
     * PUT /api/v1/settings/profile
     */
    async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
        try {
            const formData = new FormData();

            if (data.profile_image instanceof File) {
                formData.append("profile_image", data.profile_image);
            } else if (data.profile_image === null) {
                // Send multiple common removal signals to ensure backend picks up the intent
                formData.append("profile_image", "");
                formData.append("remove_profile_image", "1");
                formData.append("delete_profile_image", "1");
                console.log("PUT /api/v1/settings/profile - Requesting photo REMOVAL");
            }

            // Backend endpoint specifically expects multipart/form-data. It ignores JSON entirely.
            if (data.full_name) formData.append("full_name", data.full_name);
            if (data.address) formData.append("address", data.address);
            if (data.pan_number) formData.append("pan_number", data.pan_number);
            if (data.aadhaar_number) formData.append("aadhaar_number", data.aadhaar_number);
            if (data.designation) formData.append("designation", data.designation);
            if (data.joining_date) formData.append("joining_date", data.joining_date);
            if (data.mobile_number) formData.append("mobile_number", data.mobile_number);
            if (data.email) formData.append("email", data.email);
            if (data.role) formData.append("role", data.role);
            if (data.is_active !== undefined) formData.append("is_active", data.is_active ? "1" : "0");

            console.log("PUT /api/v1/settings/profile - Final FormData contents:");
            formData.forEach((value, key) => {
                console.log(`  ${key}: ${value instanceof File ? `[File: ${value.name}]` : value}`);
            });

            const response = await api.put("/settings/profile", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            console.log("PUT /api/v1/settings/profile - SUCCESS response data:", response.data);
            const finalProfile = {
                ...response.data,
                is_active: data.is_active, // Force preserve the requested status in local cache
                // If we explicitly requested a removal, ensure local cache reflects it even if backend response is stale
                profile_image: data.profile_image === null ? null : (response.data.profile_image || data.profile_image)
            };
            localStorage.setItem("mock_profile", JSON.stringify(finalProfile));
            localStorage.setItem("mock_profile_saved_at", Date.now().toString());
            return finalProfile;
        } catch (error: any) {
            console.error("Profile Update API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get Company Settings
     * GET /api/v1/settings/company
     */
    async getCompanySettings(): Promise<CompanySettings> {
        try {
            const response = await api.get("/settings/company");
            return response.data;
        } catch (error: any) {
            console.error("Get Company Settings Error:", error.message);
            throw error;
        }
    },

    /**
     * Update Company Settings
     * PUT /api/v1/settings/company
     */
    async updateCompanySettings(data: UpdateCompanySettings): Promise<CompanySettings> {
        try {
            const response = await api.put("/settings/company", data);
            return response.data;
        } catch (error: any) {
            console.error("Update Company Settings Error:", error.message);
            throw error;
        }
    },

    /**
     * Upload Company Logo
     * POST /api/v1/settings/upload-logo
     */
    async uploadLogo(file: File): Promise<{ message: string; file_path: string }> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await api.post("/settings/upload-logo", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error: any) {
            console.error("Logo Upload Error:", error.message);
            throw error;
        }
    },

    /**
     * Upload Company Signature
     * POST /api/v1/settings/upload-signature
     */
    async uploadSignature(file: File): Promise<{ message: string; file_path: string }> {
        try {
            const formData = new FormData();
            formData.append("file", file);
            const response = await api.post("/settings/upload-signature", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            return response.data;
        } catch (error: any) {
            console.error("Signature Upload Error:", error.message);
            throw error;
        }
    }
};
