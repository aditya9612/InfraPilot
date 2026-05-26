import api from "./api";

export interface CreateDrawingRequest {
    project_id: number;
    drawing_name: string;
    version: string;
    approved_by?: string | null;
    date?: string | null;
    remarks?: string | null;
    file?: string | null;
    approval_status?: string | null;
    approval_id?: string | null;
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
    approval_status?: string | null;
    approval_id?: string | null;
    created_at?: string;
    updated_at?: string;
}

// ─── Drawing Service ──────────────────────────────────────────────────────────
export const drawingService = {
    /**
     * Helper to prefix relative paths for images
     */
    resolveUrl(path: string | null): string | null {
        if (!path) return null;
        if (path.startsWith('http') || path.startsWith('data:')) return path;
        
        let baseUrl = import.meta.env.VITE_API_URL || '';
        if (path.startsWith('/uploads') || path.startsWith('uploads')) {
            try {
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
     * Upload a new drawing
     * POST /api/v1/drawings/upload
     * Body: multipart/form-data
     * Fields: data (stringified JSON), file (binary)
     */
    async uploadDrawing(payload: any) {
        console.log("POST /api/v1/drawings/upload - Processing Multipart Upload");

        const formData = new FormData();
        
        // Append all text fields to FormData
        formData.append("project_id", String(payload.project_id));
        formData.append("drawing_name", payload.drawing_name);
        formData.append("version", payload.version);
        formData.append("approved_by", payload.approved_by || "Site Engineer");
        formData.append("date", payload.date || new Date().toISOString().split('T')[0]);
        formData.append("remarks", payload.remarks || "No remarks");

        // Handle File upload
        if (payload.file instanceof File) {
            formData.append("file", payload.file);
        }

        try {
            const response = await api.post("/drawings/upload", formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log("POST /api/v1/drawings/upload - SUCCESS", response.data);
            return response.data;
        } catch (error: any) {
            const status = error.response?.status;
            console.warn(`Drawing Upload API Error (${status}):`, error.response?.data || error.message);
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
            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            console.warn("Fetch Drawing Versions Failed:", error?.response?.data || error.message);
            return [];
        }
    },

    async getLatest(projectId: number) {
        console.log(`GET /api/v1/drawings/${projectId}/latest`);
        try {
            const response = await api.get(`/drawings/${projectId}/latest`);
            return response.data;
        } catch (error: any) {
            console.error("Fetch Latest Drawing Failed:", error?.message);
            // Fallback to the user-provided mock payload
            if (error?.response?.status === 404 || error?.response?.status === 401) {
                return {
                    "project_id": projectId,
                    "drawing_name": "Latest Structural Plan",
                    "version": "v1.2",
                    "date": new Date().toISOString().split('T')[0],
                    "remarks": "Final review pending",
                    "id": 2,
                    "file_url": "uploads/drawings/sample.png",
                    "approval_status": "Pending",
                    "approval_id": 3
                };
            }
            throw error;
        }
    },

    /**
     * Update an existing drawing
     * PUT /api/v1/drawings/{id}
     */
    async updateDrawing(id: number | string, data: any) {
        console.log(`PUT /api/v1/drawings/${id}`);
        try {
            const response = await api.put(`/drawings/${id}`, data);
            return response.data;
        } catch (error: any) {
            console.warn(`Update Drawing API Error:`, error.response?.data || error.message);
            throw error;
        }
    },



    /**
     * Download Document
     * GET /api/v1/drawings/documents/download/{id}
     */
    async downloadDocument(id: number) {
        try {
            console.log(`GET /api/v1/drawings/documents/download/${id}`);
            const response = await api.get(`/drawings/documents/download/${id}`, {
                responseType: 'blob'
            });
            
            // Create a temporary link to trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `drawing_${id}.pdf`); 
            document.body.appendChild(link);
            link.click();
            link.remove();
            return true;
        } catch (error: any) {
            console.error(`Download Document ${id} Failed:`, error?.message);
            throw error;
        }
    },

    /**
     * View a specific drawing document
     * GET /api/v1/drawings/documents/view/{id}
     */
    async viewDocument(id: number | string) {
        const numericId = typeof id === 'string' ? id.replace(/[^0-9]/g, '') : id;
        console.log(`GET /api/v1/drawings/documents/view/${numericId}`);
        
        const response = await api.get(`/drawings/documents/view/${numericId}`, {
            responseType: 'blob'
        });

        return {
            data: response.data,
            contentType: response.headers?.['content-type'] || 'application/pdf'
        };
    }
};
