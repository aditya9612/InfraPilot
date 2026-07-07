import api from "./api";

/**
 * Shape returned by POST /api/v1/projects/ (task request endpoint)
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
 * Endpoint: POST /api/v1/projects/
 * The backend expects: title, category, project_id, priority,
 * description, attachment_url, assigned_to
 */
export const taskRequestService = {
    /**
     * Fetch all task requests
     * GET /api/v1/projects/
     */
    async getRequests(): Promise<TaskRequest[]> {
        try {
            const response = await api.get("projects");
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
     * POST /api/v1/projects/
     *
     * Sends fields exactly as the backend expects them:
     * title, category, project_id, priority, description,
     * attachment_url, assigned_to
     */
    async createRequest(formData: {
        title: string;
        description: string;
        category: string;
        priority: string;
        project_id?: number | string;
        attachment_url?: string;
        assigned_to?: number;
    }) {
        const body: Record<string, any> = {
            title: formData.title,
            description: formData.description,
            category: formData.category,
            priority: formData.priority,
        };

        if (formData.project_id !== undefined && formData.project_id !== "") {
            body.project_id = Number(formData.project_id);
        }
        if (formData.attachment_url) {
            body.attachment_url = formData.attachment_url;
        }
        if (formData.assigned_to && formData.assigned_to > 0) {
            body.assigned_to = formData.assigned_to;
        }

        console.log("[taskRequestService] POST /api/v1/projects/ body:", body);
        const response = await api.post("projects", body);
        return response.data;
    },

    /**
     * Update an existing task request
     * PUT /api/v1/projects/{request_id}
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
            assigned_to: number;
        }>
    ) {
        const body: Record<string, any> = {};
        if (formData.title !== undefined)       body.title       = formData.title;
        if (formData.description !== undefined) body.description = formData.description;
        if (formData.category !== undefined)    body.category    = formData.category;
        if (formData.priority !== undefined)    body.priority    = formData.priority;
        if (formData.project_id !== undefined)  body.project_id  = Number(formData.project_id);
        if (formData.attachment_url)            body.attachment_url = formData.attachment_url;
        if (formData.assigned_to && formData.assigned_to > 0) body.assigned_to = formData.assigned_to;

        console.log(`[taskRequestService] PUT /api/v1/projects/${requestId} body:`, body);
        const response = await api.put(`projects/${requestId}`, body);
        return response.data;
    },
};

export default taskRequestService;
