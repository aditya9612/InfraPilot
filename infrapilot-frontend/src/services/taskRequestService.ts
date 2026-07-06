import api from "./api";

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
}

/**
 * Service for managing Task Requests in the Labour Module.
 * Note: Per user instructions, these use the /api/v1/projects/ base endpoint.
 */
export const taskRequestService = {
    /**
     * Fetch all task requests
     * GET /api/v1/projects/
     */
    async getRequests() {
        try {
            const response = await api.get("projects");
            const data = response.data;
            if (!data) return [];
            // The backend might return a wrapped object or plain array
            return Array.isArray(data) ? data : (data?.items || data?.data || []);
        } catch (error) {
            console.error("Failed to fetch task requests:", error);
            return [];
        }
    },

    /**
     * Submit a new task request
     * POST /api/v1/projects/
     */
    async createRequest(data: Omit<TaskRequest, 'id' | 'status'>) {
        try {
            const response = await api.post("projects", data);
            return response.data;
        } catch (error) {
            console.error("Failed to create task request:", error);
            throw error;
        }
    },

    /**
     * Update an existing task request
     * PUT /api/v1/projects/{request_id}
     */
    async updateRequest(requestId: number | string, data: Partial<TaskRequest>) {
        try {
            const response = await api.put(`projects/${requestId}`, data);
            return response.data;
        } catch (error) {
            console.error(`Failed to update task request ${requestId}:`, error);
            throw error;
        }
    }
};

export default taskRequestService;
