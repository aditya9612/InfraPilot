import api from "./api";

export interface CreateDrawingRequest {
    project_id: number;
    drawing_name: string;
    version: string;
    approved_by: string;
    date: string;
    remarks: string;
    file?: File; // Optional if we are sending as multipart
}

export interface DrawingResponse {
    id: number;
    project_id: number;
    drawing_name: string;
    version: string;
    approved_by: string;
    date: string;
    remarks: string;
    file_url: string;
}

export const drawingService = {
    /**
     * Upload a new drawing
     * POST /api/v1/drawings/upload
     */
    async uploadDrawing(data: CreateDrawingRequest) {
        try {
            // Using FormData for potential file upload support in the future
            // Even if the user provided a JSON body, usually drawing APIs expect multipart
            // But I will stick to JSON if the user only provided JSON
            
            const response = await api.post("/drawings/upload", data);
            return response.data;
        } catch (error: any) {
            console.error("Drawing Upload Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get all versions of drawings for a project
     * GET /api/v1/drawings/{project_id}/versions
     */
    async getVersions(projectId: number) {
        try {
            const response = await api.get(`/drawings/${projectId}/versions`);
            return response.data;
        } catch (error: any) {
            console.error("Fetch Drawing Versions Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get the latest drawing for a project
     * GET /api/v1/drawings/{project_id}/latest
     */
    async getLatest(projectId: number) {
        try {
            const response = await api.get(`/drawings/${projectId}/latest`);
            return response.data;
        } catch (error: any) {
            console.error("Fetch Latest Drawing Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Delete a drawing record
     * DELETE /api/v1/drawings/{id}
     */
    async deleteDrawing(id: number | string) {
        try {
            const response = await api.delete(`/drawings/${id}`);
            return response.data;
        } catch (error: any) {
            console.error("Delete Drawing Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
