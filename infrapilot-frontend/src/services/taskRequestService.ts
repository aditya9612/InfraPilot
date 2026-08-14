import api from "./api";

/**
 * Shape returned by GET/POST /api/v1/projects/task-requests
 * Backend response fields: title, category, project_id, priority,
 * description, attachment_url, assigned_to, id, status, created_at, updated_at
 */
export interface TaskRequest {
    id: number;
    title: string;
    description: string;
    category: string;
    priority: string;
    status: string;
    project_id?: number | string;
    attachment_url?: string;
    assigned_to?: number;
    created_at?: string;
    updated_at?: string;
    is_deleted?: boolean;
}

/**
 * Service for the Labour Module → Task Requests page.
 * Uses POST/GET /api/v1/projects/task-requests
 */
export const taskRequestService = {
    /**
     * Fetch all task requests
     * GET /api/v1/projects/task-requests
     */
    async getRequests(): Promise<TaskRequest[]> {
        try {
            const response = await api.get("projects/task-requests");
            const data = response.data;
            if (!data) return [];
            const items = Array.isArray(data)
                ? data
                : (data?.items || data?.data || []);
            return items;
        } catch (error) {
            console.error("Failed to fetch task requests:", error);
            return [];
        }
    },

    /**
     * Submit a new task request
     * POST /api/v1/projects/task-requests
     */
    async createRequest(formData: {
        title: string;
        description: string;
        category: string;
        priority: string;
        project_id?: number | string;
        attachment_url?: string;
        attachment_file_name?: string;
        assigned_to?: number;
    }) {
        let attachmentUrl = formData.attachment_url;
        // If attachment_url is a base64 string, don't send huge base64 payload that exceeds backend varchar limit (causing 422)
        if (attachmentUrl && attachmentUrl.startsWith('data:')) {
            attachmentUrl = formData.attachment_file_name || "attachment.png";
        }

        const body: Record<string, any> = {
            title: formData.title,
            description: formData.description,
            category: formData.category || "New Task",
            priority: formData.priority || "Medium",
        };

        if (formData.project_id !== undefined && formData.project_id !== "") {
            body.project_id = Number(formData.project_id);
        }
        if (attachmentUrl) {
            body.attachment_url = attachmentUrl;
        }
        if (formData.assigned_to && formData.assigned_to > 0) {
            body.assigned_to = formData.assigned_to;
        }

        console.log("[taskRequestService] POST /api/v1/projects/task-requests body:", body);
        const response = await api.post("projects/task-requests", body);
        return response.data;
    },

    /**
     * Update an existing task request
     * PUT /api/v1/projects/task-requests/{request_id}
     */
    async updateRequest(
        requestId: number | string,
        formData: Partial<{
            title: string;
            description: string;
            category: string;
            priority: string;
            project_id: number | string;
            attachment_url: string;
            attachment_file_name: string;
            assigned_to: number;
        }>
    ) {
        const body: Record<string, any> = {};
        if (formData.title !== undefined)       body.title       = formData.title;
        if (formData.description !== undefined) body.description = formData.description;
        if (formData.category !== undefined)    body.category    = formData.category;
        if (formData.priority !== undefined)    body.priority    = formData.priority;
        if (formData.project_id !== undefined)  body.project_id  = Number(formData.project_id);
        if (formData.attachment_url) {
            let attUrl = formData.attachment_url;
            if (attUrl.startsWith('data:')) {
                attUrl = formData.attachment_file_name || "attachment.png";
            }
            body.attachment_url = attUrl;
        }
        if (formData.assigned_to && formData.assigned_to > 0) body.assigned_to = formData.assigned_to;

        console.log(`[taskRequestService] PUT /api/v1/projects/task-requests/${requestId} body:`, body);
        const response = await api.put(`projects/task-requests/${requestId}`, body);
        return response.data;
    },

    /**
     * Delete an existing task request
     * DELETE /api/v1/projects/task-requests/{request_id}
     */
    async deleteRequest(requestId: number | string) {
        console.log(`[taskRequestService] DELETE /api/v1/projects/task-requests/${requestId}`);
        const response = await api.delete(`projects/task-requests/${requestId}`);
        return response.data;
    },
};

export default taskRequestService;
