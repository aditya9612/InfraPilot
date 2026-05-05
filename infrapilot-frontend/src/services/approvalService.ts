import api from "./api";

export interface ApprovalItem {
    id: number;
    entity_type: string;
    entity_id: number;
    status: "Pending" | "Approved" | "Rejected" | string;
    requested_by: number;
    approved_by: number | null;
    remarks: string | null;
}

export interface CreateApprovalRequest {
    entity_type: string;
    entity_id: number;
    remarks: string;
}

export const approvalService = {
    /**
     * Get List of Approvals
     * GET /api/v1/approvals
     */
    async getApprovals() {
        try {
            const response = await api.get("/approvals");
            return response.data;
        } catch (error: any) {
            console.error("Get Approvals Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Create a new Approval Request
     * POST /api/v1/approvals
     */
    async createApproval(data: CreateApprovalRequest) {
        try {
            const response = await api.post("/approvals", data);
            return response.data;
        } catch (error: any) {
            console.error("Create Approval Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Approve a request
     * PUT /api/v1/approvals/{id}/approve
     */
    async approve(id: number, remarks: string) {
        try {
            const response = await api.put(`/approvals/${id}/approve`, { remarks });
            return response.data;
        } catch (error: any) {
            console.error("Approve Error:", error.response?.data || error.message);
            throw error;
        }
    },

    /**
     * Reject a request
     * PUT /api/v1/approvals/{id}/reject
     */
    async reject(id: number, remarks: string) {
        try {
            const response = await api.put(`/approvals/${id}/reject`, { remarks });
            return response.data;
        } catch (error: any) {
            console.error("Reject Error:", error.response?.data || error.message);
            throw error;
        }
    }
};
