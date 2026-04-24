export const dashboardService = {
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
