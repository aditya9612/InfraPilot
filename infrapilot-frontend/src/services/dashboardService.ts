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
   * Get Client Dashboard stats for a specific project
   * GET /api/v1/dashboard/client/{project_id}
   */
  async getClientDashboard(projectId: number): Promise<ClientDashboardData> {
    try {
      const response = await api.get(`/dashboard/client/${projectId}`);
      return response.data;
    } catch (error) {
      // Hybrid Mock Fallback
      console.warn("Backend offline — falling back to hybrid mock for Client Dashboard");
      return {
        project_id: projectId,
        status: "PLANNED",
        progress_percent: 0,
        budget_total: 0,
        total_expense: 0,
        budget_used_percent: 0,
        remaining_budget: 0,
        milestones_total: 0,
        milestones_completed: 0,
        tasks_total: 1,
        tasks_completed: 0,
        start_date: "2026-04-02",
        end_date: "2026-04-02",
        days_remaining: 0
      };
    }
  },

  /**
   * Get Accountant Dashboard stats
   * GET /api/v1/dashboard/accountant
   */
  async getAccountantDashboard(): Promise<{
    total_revenue: number;
    total_invoices: number;
    pending_payments: number;
    total_expense: number;
  }> {
    // Return mock data for now since the backend endpoint is not ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          total_revenue: 1250000,
          total_invoices: 45,
          pending_payments: 12,
          total_expense: 340000,
        });
      }, 500); // simulate network delay
    });
  },
};
