import api from "./api";
import type { SitePhoto, SitePhotoResponse } from "../types/sitePhoto";

export const sitePhotoService = {
    /**
     * Get List of Site Photos
     * GET /api/v1/site-photos
     */
    async getPhotos(params?: any): Promise<SitePhotoResponse> {
        try {
            const response = await api.get("/site-photos", { params });
            return response.data;
        } catch (error: any) {
            console.error("Get Site Photos API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Upload Site Photo
     * POST /api/v1/site-photos
     */
    async uploadPhoto(data: FormData): Promise<SitePhoto> {
        try {
            const response = await api.post("/site-photos", data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
            return response.data;
        } catch (error: any) {
            console.error("Upload Site Photo API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete Site Photo
     * DELETE /api/v1/site-photos/{id}
     */
    async deletePhoto(id: number): Promise<{ success: boolean; message: string }> {
        try {
            const response = await api.delete(`/site-photos/${id}`);
            return response.data;
        } catch (error: any) {
            console.error(`Delete Site Photo ${id} API Error:`, error.response?.data || error.message);
            throw error;
        }
    }
};
