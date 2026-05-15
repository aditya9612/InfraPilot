import api from "./api";

export interface ClientApproval {
  id: string;
  title: string;
  amount: string;
  submitted: string;
  deadline: string;
  status: "Pending Client" | "Approved" | "Rejected";
}

export const approvalService = {
  submitApproval: async (payload: { entity_type: string, entity_id: number, remarks: string }): Promise<any> => {
    try {
      const response = await api.post("/approvals", payload);
      return response.data;
    } catch (error: any) {
      console.error("Submit Approval Error:", error.response?.data || error.message);
      throw error;
    }
  },

  getApprovals: async (projectId: number): Promise<ClientApproval[]> => {
    try {
      const response = await api.get('/approvals', {
        params: { project_id: projectId }
      });
      return response.data;
    } catch (error: any) {
      console.error("Get Approvals Error:", error.response?.data || error.message);
      throw error;
    }
  },

  approveApproval: async (id: string, remarks: string = "Approved via Client Portal") => {
    try {
      const response = await api.put(`/approvals/${id}/approve`, { remarks });
      return response.data;
    } catch (error: any) {
      console.error(`Approve Approval ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  rejectApproval: async (id: string, remarks: string = "Rejected via Client Portal") => {
    try {
      const response = await api.put(`/approvals/${id}/reject`, { remarks });
      return response.data;
    } catch (error: any) {
      console.error(`Reject Approval ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  }
};
