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

export interface CreateTaskRequestData {
    title: string;
    description?: string;
    category?: string;
    priority?: string;
    project_id: number | string;
    assigned_to?: number | string;
    attachment?: File | null;
    attachment_url?: string;
    attachment_file_name?: string;
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
     * POST /api/v1/projects/task-requests (multipart/form-data)
     */
    async createRequest(formData: FormData | CreateTaskRequestData) {
        let payload: FormData;

        if (formData instanceof FormData) {
            payload = formData;
        } else {
            payload = new FormData();
            payload.append("project_id", String(formData.project_id));
            payload.append("title", formData.title);
            payload.append("category", formData.category || "New Task");
            payload.append("priority", formData.priority || "Medium");

            if (formData.description) {
                payload.append("description", formData.description);
            }
            if (formData.assigned_to && Number(formData.assigned_to) > 0) {
                payload.append("assigned_to", String(formData.assigned_to));
            }
            if (formData.attachment instanceof File) {
                payload.append("attachment", formData.attachment);
            }
        }

        console.log("[taskRequestService] POST /api/v1/projects/task-requests (multipart/form-data)");
        const response = await api.post("projects/task-requests", payload);
        return response.data;
    },

    /**
     * Update an existing task request
     * PUT /api/v1/projects/task-requests/{request_id} (multipart/form-data)
     */
    async updateRequest(
        requestId: number | string,
        formData: FormData | Partial<CreateTaskRequestData>
    ) {
        let payload: FormData;

        if (formData instanceof FormData) {
            payload = formData;
        } else {
            payload = new FormData();
            if (formData.project_id !== undefined && formData.project_id !== "") {
                payload.append("project_id", String(formData.project_id));
            }
            if (formData.title !== undefined) payload.append("title", formData.title);
            if (formData.category !== undefined) payload.append("category", formData.category);
            if (formData.priority !== undefined) payload.append("priority", formData.priority);
            if (formData.description !== undefined) payload.append("description", formData.description);
            if (formData.assigned_to && Number(formData.assigned_to) > 0) {
                payload.append("assigned_to", String(formData.assigned_to));
            }
            if (formData.attachment instanceof File) {
                payload.append("attachment", formData.attachment);
            }
        }

        console.log(`[taskRequestService] PUT /api/v1/projects/task-requests/${requestId} (multipart/form-data)`);
        const response = await api.put(`projects/task-requests/${requestId}`, payload);
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
