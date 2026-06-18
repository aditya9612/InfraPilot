import api from "./api";

export interface Alert {
  id: string | number;
  project_id: number;
  alert_type: string;
  message: string;
  user_id: number;
  status: string;
  created_at: string;
  project_name?: string;
  end_date?: string;
  start_date?: string;
}

export const alertService = {
  /**
   * Get dynamic alerts for the user
   * GET /api/v1/alerts
   */
  async getAlerts(): Promise<Alert[]> {
    const response = await api.get("/alerts");
    return response.data;
  },

  async createAlert(data: Partial<Alert>): Promise<Alert> {
    const response = await api.post("/alerts", data);
    return response.data;
  },

  async markAlertRead(id: number): Promise<any> {
    const response = await api.put(`/alerts/${id}/read`);
    return response.data;
  },

  async deleteAlert(id: number): Promise<any> {
    const response = await api.delete(`/alerts/${id}`);
    return response.data;
  }
};
