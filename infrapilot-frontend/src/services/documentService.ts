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
    async getStats(params?: { project_id?: number }): Promise<DocumentStats> {
        const response = await api.get("/documents/stats", { params });
        const res = response.data;
        return res?.data || res;
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
        if (params.title) formData.append("title", params.title);
        if (params.document_type) formData.append("document_type", params.document_type);
        if (params.parent_id) formData.append("parent_id", params.parent_id.toString());
        if (params.remarks) formData.append("remarks", params.remarks);
        if (params.version) formData.append("version", params.version);
        if (params.date) formData.append("date", params.date);
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
        try {
            // Document download endpoint returns a JSON with { file_url: string }
            const data = await this.getDownloadUrl(id);
            const fileUrl = data.file_url || (data as any).url || (data as any).download_url;

            if (fileUrl) {
                const link = document.createElement('a');
                link.href = fileUrl;
                link.setAttribute('download', fileName || `document_${id}`);
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                link.remove();
                return;
            }
        } catch (err: any) {
            // Re-throw server errors explicitly instead of attempting a broken fallback
            if (err.response && err.response.status >= 400) {
                throw err;
            }
            // If JSON parse fails or file_url is missing, fallback to blob fetch
            console.warn("Could not fetch pre-signed URL for document, attempting raw blob download.");
        }

        // Fallback for native blob response
        const response = await api.get(`/documents/${id}/download`, {
            responseType: 'blob'
        });

        // Ensure we preserve the MIME type so the OS knows what to do with the file natively
        const contentType = response.headers['content-type'] || response.data.type || 'application/octet-stream';
        const blob = new Blob([response.data], { type: contentType });

        let extension = 'pdf'; // Default
        if (contentType.includes('image/png')) extension = 'png';
        else if (contentType.includes('image/jpeg') || contentType.includes('image/jpg')) extension = 'jpg';
        else if (contentType.includes('spreadsheet') || contentType.includes('excel')) extension = 'xlsx';
        else if (contentType.includes('word') || contentType.includes('document')) extension = 'docx';
        else if (contentType.includes('image/gif')) extension = 'gif';
        else if (contentType.includes('image/webp')) extension = 'webp';

        const finalName = fileName ? (fileName.includes('.') ? fileName : `${fileName}.${extension}`) : `document_${id}.${extension}`;

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', finalName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    },

    /**
     * View a specific document
     * GET /api/v1/documents/{id}/download (Using download as proxy for view metadata)
     */
    async viewDocument(id: number) {
        const data = await this.getDownloadUrl(id);
        const fileUrl = data.file_url || (data as any).url || (data as any).download_url;

        if (fileUrl) {
            try {
                // Attempt to fetch as blob to bypass potential Content-Disposition: attachment headers
                const fetchRes = await fetch(fileUrl);
                const blob = await fetchRes.blob();

                let ct = fetchRes.headers.get('content-type') || blob.type || 'application/pdf';
                const ext = fileUrl.toLowerCase().split('?')[0];
                if (ext.endsWith('.png')) ct = 'image/png';
                else if (ext.endsWith('.jpg') || ext.endsWith('.jpeg')) ct = 'image/jpeg';
                else if (ext.endsWith('.pdf')) ct = 'application/pdf';
                else if (ext.endsWith('.svg')) ct = 'image/svg+xml';
                else if (ext.endsWith('.gif')) ct = 'image/gif';
                else if (ext.endsWith('.webp')) ct = 'image/webp';

                return {
                    data: blob,
                    contentType: ct,
                    fileUrl
                };
            } catch (err) {
                // If CORS blocks the fetch, fallback to returning the raw URL for the iframe to handle natively
                console.warn("CORS or fetch error, falling back to direct URL viewing.", err);
                return { fileUrl };
            }
        }

        throw new Error("No file URL found for document.");
    }
};
