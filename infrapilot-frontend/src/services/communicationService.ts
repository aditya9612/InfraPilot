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

export interface MessagePayload {
  message: string;
  attachment_url?: string | null;
  parent_id?: number | null;
}

export const communicationService = {
  /**
   * Send a message for a project
   * POST /api/v1/communication/{project_id}/messages
   */
  async sendMessage(projectId: number, payload: MessagePayload) {
    if (isMockUser()) {
      console.log('Mock: Message sent.', payload);
      return {
        id: Math.floor(Math.random() * 1000),
        status: "sent",
        attachment_url: payload.attachment_url || null,
        created_at: new Date().toISOString(),
        message: payload.message,
        project_id: projectId,
        parent_id: payload.parent_id || null,
        created_by: 1
      };
    }

    try {
      const response = await api.post(`/communication/${projectId}/messages`, payload);
      return response.data;
    } catch (error: any) {
      console.error(`Send Message for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get messages for a project
   * GET /api/v1/communication/{project_id}/messages
   */
  async getMessages(projectId: number) {
    if (isMockUser()) {
      return [
        {
          id: 1,
          status: "sent",
          attachment_url: "Casting_Schedule_V3.pdf",
          created_at: "2026-04-02T14:15:00",
          message: "Phase 3 slab casting will begin Monday. Please ensure the approval for the variation order is sent today.",
          project_id: projectId,
          parent_id: null,
          created_by: 2 // Rajesh Mehta
        },
        {
          id: 4,
          status: "sent",
          attachment_url: "https://www.google.com/",
          created_at: "2026-05-04T10:25:53",
          message: "First message",
          project_id: projectId,
          parent_id: null,
          created_by: 1 // You
        }
      ];
    }

    try {
      const response = await api.get(`/communication/${projectId}/messages`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Messages for Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get replies for a specific message
   * GET /api/v1/communication/messages/{message_id}/replies
   */
  async getMessageReplies(messageId: number) {
    if (isMockUser()) {
      if (messageId === 4) {
        return [
          {
            status: "sent",
            attachment_url: null,
            created_at: "2026-05-04T10:30:11",
            message: "Reply message",
            id: 5,
            project_id: 1,
            parent_id: 4,
            created_by: 1
          }
        ];
      }
      return [];
    }

    try {
      const response = await api.get(`/communication/messages/${messageId}/replies`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Replies for Message ${messageId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a message as read
   * PUT /api/v1/communication/messages/{id}/read
   */
  async markMessageRead(id: number) {
    if (isMockUser()) {
      return { message: "read" };
    }

    try {
      const response = await api.put(`/communication/messages/${id}/read`);
      return response.data;
    } catch (error: any) {
      console.error(`Mark Read Message ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Mark a message as delivered
   * PUT /api/v1/communication/messages/{id}/delivered
   */
  async markMessageDelivered(id: number) {
    if (isMockUser()) {
      return { message: "delivered" };
    }

    try {
      const response = await api.put(`/communication/messages/${id}/delivered`);
      return response.data;
    } catch (error: any) {
      console.error(`Mark Delivered Message ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Get count of unread messages for a project
   * GET /api/v1/communication/{project_id}/messages/unread-count
   */
  async getUnreadCount(projectId: number) {
    if (isMockUser()) {
      return { unread: 2 }; // Mock unread count
    }

    try {
      const response = await api.get(`/communication/${projectId}/messages/unread-count`);
      return response.data;
    } catch (error: any) {
      console.error(`Get Unread Count Project ${projectId} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete a message
   * DELETE /api/v1/communication/messages/{id}
   */
  async deleteMessage(id: number) {
    if (isMockUser()) {
      return { message: "Message deleted" };
    }

    try {
      const response = await api.delete(`/communication/messages/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`Delete Message ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update a message
   * PUT /api/v1/communication/messages/{id}
   */
  async updateMessage(id: number, payload: MessagePayload) {
    if (isMockUser()) {
      return { ...payload, id, status: "updated" };
    }

    try {
      const response = await api.put(`/communication/messages/${id}`, payload);
      return response.data;
    } catch (error: any) {
      console.error(`Update Message ${id} Error:`, error.response?.data || error.message);
      throw error;
    }
  }
};
