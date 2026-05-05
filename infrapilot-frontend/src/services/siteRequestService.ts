import api from "./api";

export interface CreateSiteRequest {
    project_id: number;
    request_type: "Material" | "Labour" | "Equipment" | string;
    description: string;
    quantity: number;
}

export interface SiteRequestResponse extends CreateSiteRequest {
    id: number;
    requested_by: number;
    approved_by: number | null;
    status: "Pending" | "Approved" | "Rejected" | string;
}

export const siteRequestService = {
    /**
     * Create a new site request (Requisition)
     * POST /api/v1/site-requests
     */
    async createRequest(data: CreateSiteRequest) {
        try {
            const response = await api.post("/site-requests", data, {
                params: { project_id: data.project_id }
            });
            return response.data;
        } catch (error: any) {
            console.error("Create Site Request Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Get all site requests for a project
     * GET /api/v1/site-requests?project_id=1
     */
    /**
     * Get all site requests for a project
     * GET /api/v1/site-requests?project_id=1
     */
    async getRequests(projectId: number) {
        try {
            const response = await api.get("/site-requests", {
                params: { project_id: projectId }
            });
            return response.data;
        } catch (error: any) {
            console.error("Get Site Requests Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Approve a site request
     * PUT /api/v1/site-requests/{id}/approve
     */
    async approveRequest(id: number | string) {
        try {
            const response = await api.put(`/site-requests/${id}/approve`);
            return response.data;
        } catch (error: any) {
            console.error("Approve Request Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Reject a site request
     * PUT /api/v1/site-requests/{id}/reject
     */
    async rejectRequest(id: number | string) {
        try {
            const response = await api.put(`/site-requests/${id}/reject`);
            return response.data;
        } catch (error: any) {
            console.error("Reject Request Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
