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
 * Uses POST /api/v1/projects/ and GET /api/v1/projects/ (with trailing slash)
 */
export const taskRequestService = {
    /**
     * Fetch all task requests
     * GET /api/v1/projects/
     */
    async getRequests(): Promise<TaskRequest[]> {
        try {
            // Note the trailing slash at the end of 'projects/' to request the task requests API
            const response = await api.get("projects/");
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
            // Convert to lowercase to match backend expects (e.g. "support", "high")
            category: (formData.category || "").toLowerCase(),
            priority: (formData.priority || "").toLowerCase(),
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
        // Note the trailing slash at the end of 'projects/'
        const response = await api.post("projects/", body);
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
        if (formData.category !== undefined)    body.category    = formData.category.toLowerCase();
        if (formData.priority !== undefined)    body.priority    = formData.priority.toLowerCase();
        if (formData.project_id !== undefined)  body.project_id  = Number(formData.project_id);
        if (formData.attachment_url)            body.attachment_url = formData.attachment_url;
        if (formData.assigned_to && formData.assigned_to > 0) body.assigned_to = formData.assigned_to;

        console.log(`[taskRequestService] PUT /api/v1/projects/${requestId} body:`, body);
        const response = await api.put(`projects/${requestId}`, body);
        return response.data;
    },
};

export default taskRequestService;
