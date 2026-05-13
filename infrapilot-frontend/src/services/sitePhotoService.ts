import api from "./api";
import type { SitePhoto, SitePhotoResponse } from "../types/sitePhoto";

export const sitePhotoService = {
    /**
     * Get List of Site Photos
     * GET /api/v1/site-photos
     */
    async getPhotos(params?: any): Promise<SitePhotoResponse> {
        try {
            const response = await api.get("/site-photos", { 
                params: {
                    project_id: params?.project_id || 1,
                    activity_tag: params?.activity_tag || "",
                    location_tag: params?.location_tag || "",
                    start_date: params?.start_date || "",
                    end_date: params?.end_date || ""
                } 
            });
            
            // Defensive structure normalization for production data
            const rawData = response.data;
            let items: SitePhoto[] = [];
            
            if (Array.isArray(rawData)) {
                items = rawData;
            } else if (rawData && typeof rawData === 'object') {
                items = rawData.items || rawData.data || (Array.isArray(rawData) ? rawData : []);
            }
            
            // Normalize photo_url to url for UI compatibility
            const normalizedItems = items.map((p: any) => ({
                ...p,
                url: p.url || p.photo_url
            }));

            return { items: normalizedItems };
        } catch (error: any) {
            console.error("Get Site Photos API Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Upload Site Photo
     * POST /api/v1/site-photos/upload
     * Body: multipart/form-data
     */
    async uploadPhoto(data: FormData): Promise<SitePhoto> {
        const projectId = data.get("project_id") || "36";
        try {
            console.log(`POST /api/v1/site-photos/upload?project_id=${projectId}`);
            
            const response = await api.post("/site-photos/upload", data, {
                params: { project_id: projectId },
                headers: { "Content-Type": "multipart/form-data" }
            });

            // Normalize photo_url to url for UI
            const result = response.data;
            return {
                ...result,
                url: result.url || result.photo_url
            };
        } catch (error: any) {
            console.error("Upload Photo API Error:", error.response?.data || error.message);
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
            console.error("Delete Photo API Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
