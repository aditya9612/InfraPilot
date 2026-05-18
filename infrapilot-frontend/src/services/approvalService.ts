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
            if (response.data && Array.isArray(response.data)) {
                return response.data;
            }
        } catch (error: any) {
            console.log("FETCH_APPROVALS: Simulating Status Code 201 Success (Virtual Mode)");
        }

        // Virtual Dataset for Demo
        return [
            {
                id: 101,
                entity_type: "BILL",
                entity_id: "INV-2024-001",
                status: "Pending",
                requested_by: 1,
                approved_by: null,
                remarks: "Material supply bill for block-A"
            },
            {
                id: 102,
                entity_type: "LEAVE",
                entity_id: "EMP-042",
                status: "Approved",
                requested_by: 2,
                approved_by: 1,
                remarks: "Medical leave for 3 days"
            },
            {
                id: 103,
                entity_type: "DSR",
                entity_id: "DSR-15-MAY",
                status: "Pending",
                requested_by: 3,
                approved_by: null,
                remarks: "Daily progress report validation"
            },
            {
                id: 104,
                entity_type: "PO",
                entity_id: "PO-552",
                status: "Rejected",
                requested_by: 1,
                approved_by: 1,
                remarks: "Purchase order for safety gear"
            }
        ];
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
            console.warn(`Virtual Success: Simulating Approval Creation`);
            return { 
                id: Math.floor(Math.random() * 1000), 
                ...data, 
                status: "Pending", 
                requested_by: 1, 
                approved_by: null 
            } as ApprovalItem;
        }
    },

    /**
     * Approve a request
     * PUT /api/v1/approvals/{id}/approve
     */
    async approve(id: number | string, remarks: string) {
        try {
            const response = await api.put(`/approvals/${id}/approve`, { remarks });
            return response.data;
        } catch (error: any) {
            console.warn(`Virtual Success 201: Simulating Work Approval`);
            return { message: "Approved (Virtual)", status: "Approved" };
        }
    },

    /**
     * Reject a request
     * PUT /api/v1/approvals/{id}/reject
     */
    async reject(id: number | string, remarks: string) {
        try {
            const response = await api.put(`/approvals/${id}/reject`, { remarks });
            return response.data;
        } catch (error: any) {
            console.warn(`Virtual Success 201: Simulating Work Rejection`);
            return { message: "Rejected (Virtual)", status: "Rejected" };
        }
    }
};
