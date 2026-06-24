import api from "./api";
import type {
    Document,
    DocumentStats,
    DocumentListResponse,
    DocumentUploadParams,
    FolderCreateParams,
    DocumentUpdateParams
} from "../types/document";

export const documentService = {
    /**
     * Get document statistics
     * GET /api/v1/documents/stats
     */
    async getStats(): Promise<DocumentStats> {
        const response = await api.get("/documents/stats");
        return response.data;
    },

    /**
     * List documents with filters
     * GET /api/v1/documents
     */
    async listDocuments(params: {
        search?: string;
        document_type?: string;
        parent_id?: number | null;
        project_id?: number | null;
        limit?: number;
        offset?: number;
    }): Promise<DocumentListResponse> {
        const response = await api.get("/documents", { params });
        return response.data;
    },

    /**
     * Upload a new document
     * POST /api/v1/documents/upload
     */
    async uploadDocument(params: DocumentUploadParams): Promise<Document> {
        const formData = new FormData();
        formData.append("project_id", params.project_id.toString());
        formData.append("title", params.title);
        formData.append("document_type", params.document_type);
        if (params.parent_id) formData.append("parent_id", params.parent_id.toString());
        if (params.remarks) formData.append("remarks", params.remarks);
        formData.append("file", params.file);

        const response = await api.post("/documents", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data;
    },

    /**
     * Create a new folder
     * POST /api/v1/documents/folders
     */
    async createFolder(params: FolderCreateParams): Promise<Document> {
        const response = await api.post("/documents/folders", null, { params });
        return response.data;
    },

    /**
     * Create a document (metadata only)
     * POST /api/v1/documents
     */
    async createDocument(data: Partial<Document>): Promise<Document> {
        const response = await api.post("/documents", data);
        return response.data;
    },

    /**
     * Get a single document details
     * GET /api/v1/documents/{id}
     */
    async getDocument(id: number): Promise<Document> {
        const response = await api.get(`/documents/${id}`);
        return response.data;
    },

    /**
     * Update document metadata
     * PUT /api/v1/documents/{id}
     */
    async updateDocument(id: number, data: DocumentUpdateParams | FormData): Promise<Document> {
        const isFormData = data instanceof FormData;
        const response = await api.put(`/documents/${id}`, data, {
            headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined
        });
        return response.data;
    },

    /**
     * Delete a document or folder
     * DELETE /api/v1/documents/{id}
     */
    async deleteDocument(id: number): Promise<void> {
        await api.delete(`/documents/${id}`);
    },

    /**
     * Get download URL or blob for a document
     * GET /api/v1/documents/{id}/download
     */
    async getDownloadUrl(id: number): Promise<{ file_url: string }> {
        const response = await api.get(`/documents/${id}/download`);
        return response.data;
    },

    /**
     * Download a specific document
     * GET /api/v1/documents/{id}/download
     */
    async downloadDocument(id: number, fileName?: string) {
        const response = await api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName || `document_${id}`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * View a specific document (as blob)
     * GET /api/v1/documents/{id}/download (Using download as proxy for view)
     */
    async viewDocument(id: number) {
        const response = await api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        });

        return {
            data: response.data,
            contentType: response.headers?.['content-type'] || 'application/pdf'
        };
    }
};
