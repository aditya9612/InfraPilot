import api from './api';

// Helper to check if the current user is the mock/dev client
const isMockUser = () => {
  try {
    const stored = localStorage.getItem("infrapilot_user");
    if (!stored) return false;
    const user = JSON.parse(stored);
    const token = user.token?.access_token || user.token;
    return token === 'mock_test_token_client_transparency';
  } catch {
    return false;
  }
};

export const approvalService = {
  /**
   * Submit an approval for an entity
   * POST /api/v1/approvals
   * Payload: { entity_type: string, entity_id: number, remarks: string }
   */
  async submitApproval(payload: { entity_type: string, entity_id: number, remarks: string }) {
    if (isMockUser()) {
      console.log('Mock: Approval submitted.', payload);
      return { 
        id: Math.floor(Math.random() * 1000),
        status: "Pending", 
        requested_by: 1,
        ...payload 
      };
    }

    try {
      const response = await api.post('/approvals', payload);
      return response.data;
    } catch (error: any) {
      console.error("Submit Approval Error:", error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get all approvals for a project
   * GET /api/v1/approvals
   */
  async getApprovals(projectId: number) {
    if (isMockUser()) {
      return [
        {
          id: 1,
          entity_type: "bill",
          entity_id: 42,
          status: "Pending",
          requested_by: 1,
          remarks: "Monthly progress billing for Phase 2"
        },
        {
          id: 2,
          entity_type: "bill",
          entity_id: 43,
          status: "Pending",
          requested_by: 1,
          remarks: "Approved after financial review"
        }
      ];
    }

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

  /**
   * Approve an approval request
   * PUT /api/v1/approvals/{id}/approve
   */
  async approveApproval(id: number, remarks: string = "Approved via Client Portal") {
    if (isMockUser()) {
      return { message: "Approved" };
    }

    try {
      const response = await api.put(`/approvals/${id}/approve`, { remarks });
      return response.data;
    } catch (error: any) {
      console.error(`Approve Approval ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Reject an approval request
   * PUT /api/v1/approvals/{id}/reject
   */
  async rejectApproval(id: number, remarks: string = "Rejected via Client Portal") {
    if (isMockUser()) {
      return { message: "Rejected" };
    }

    try {
      const response = await api.put(`/approvals/${id}/reject`, { remarks });
      return response.data;
    } catch (error: any) {
      console.error(`Reject Approval ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  }
};
