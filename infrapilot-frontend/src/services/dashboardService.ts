import api from "./api";

export interface ClientDashboardData {
  project_id: number;
  status: string;
  progress_percent: number;
  budget_total: number;
  total_expense: number;
  budget_used_percent: number;
  remaining_budget: number;
  milestones_total: number;
  milestones_completed: number;
  tasks_total: number;
  tasks_completed: number;
  start_date: string;
  end_date: string;
  days_remaining: number;
}

export const dashboardService = {
  /**
   * Get Client Dashboard stats
   * GET /api/v1/dashboard/client/{project_id}
   */
  async getClientDashboard(projectId: number): Promise<ClientDashboardData> {
    const response = await api.get<ClientDashboardData>(`/dashboard/client`, {
      params: { project_id: projectId }
    });
    return response.data;
  },

  /**
   * Get Engineer Dashboard stats
   * GET /api/v1/dashboard/engineer/{project_id}
   */
  async getEngineerDashboard(projectId: number): Promise<any> {
    const response = await api.get(`/dashboard/engineer/${projectId}`);
    return response.data;
  },

  /**
   * Get Accountant Dashboard stats
   * GET /api/v1/dashboard/accountant
   */
  async getAccountantDashboard(): Promise<any> {
    const response = await api.get('/dashboard/accountant');
    return response.data;
  },
};
