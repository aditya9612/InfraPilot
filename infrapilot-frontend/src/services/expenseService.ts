import api from './api';
import type { 
  Expense, 
  ExpenseCreateData, 
  ExpenseUpdateData, 
  ExpenseSummary, 
  ExpenseBoqComparison 
} from '../types/expense';

export const expenseService = {
  /**
   * Create a new expense
   * POST /api/v1/expenses
   */
  async createExpense(data: ExpenseCreateData): Promise<Expense> {
    const response = await api.post('/expenses', data);
    return response.data;
  },

  /**
   * List all expenses
   * GET /api/v1/expenses
   */
  async listExpenses(params?: any): Promise<Expense[]> {
    const response = await api.get('/expenses', { params });
    return response.data;
  },

  /**
   * Get expense by ID
   * GET /api/v1/expenses/{id}
   */
  async getExpenseById(id: number): Promise<Expense> {
    const response = await api.get(`/expenses/${id}`);
    return response.data;
  },

  /**
   * Update expense by ID
   * PUT /api/v1/expenses/{id}
   */
  async updateExpense(id: number, data: ExpenseUpdateData): Promise<Expense> {
    const response = await api.put(`/expenses/${id}`, data);
    return response.data;
  },

  /**
   * Delete expense by ID
   * DELETE /api/v1/expenses/{id}
   */
  async deleteExpense(id: number): Promise<void> {
    await api.delete(`/expenses/${id}`);
  },

  /**
   * Get expenses by project ID
   * GET /api/v1/expenses/project/{project_id}
   */
  async getExpensesByProject(projectId: number, params?: any): Promise<Expense[]> {
    console.log(`[Network Tab Note] Fetching expenses using API: GET /api/v1/expenses/project/${projectId}`, params);
    const response = await api.get(`/expenses/project/${projectId}`, { params });
    return response.data;
  },

  /**
   * Get expenses by category
   * GET /api/v1/expenses/category/{category}
   */
  async getExpensesByCategory(category: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/category/${category}`);
    return response.data;
  },

  /**
   * Get expenses by date range
   * GET /api/v1/expenses/date-range?start=...&end=...
   */
  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const response = await api.get('/expenses/date-range', {
      params: { start: startDate, end: endDate }
    });
    return response.data;
  },

  /**
   * Get expenses by payment mode
   * GET /api/v1/expenses/payment-mode/{mode}
   */
  async getExpensesByPaymentMode(mode: string): Promise<Expense[]> {
    const response = await api.get(`/expenses/payment-mode/${mode}`);
    return response.data;
  },

  /**
   * Get expense summary for a project
   * GET /api/v1/expenses/summary/{project_id}
   */
  async getProjectExpenseSummary(projectId: number): Promise<ExpenseSummary> {
    const response = await api.get(`/expenses/summary/${projectId}`);
    return response.data;
  },

  /**
   * Get BOQ comparison for a project
   * GET /api/v1/expenses/boq-comparison/{project_id}
   */
  async getBoqComparison(projectId: number): Promise<ExpenseBoqComparison> {
    const response = await api.get(`/boq/comparison/${projectId}`);
    return response.data;
  },

  /**
   * Get dashboard stats
   * GET /api/v1/expenses/dashboard
   */
  async getDashboardStats(): Promise<any> {
    const response = await api.get('/expenses/dashboard');
    return response.data;
  },

  /**
   * Get project allocations
   * GET /api/v1/expenses/project-allocations
   */
  async getProjectAllocations(): Promise<any> {
    const response = await api.get('/expenses/project-allocations');
    return response.data;
  },

  /**
   * Get expense ledger
   * GET /api/v1/expenses/ledger
   */
  async getExpenseLedger(): Promise<any> {
    const response = await api.get('/expenses/ledger');
    return response.data;
  },

  /**
   * Import expenses
   * POST /api/v1/expenses/import
   */
  async importExpenses(file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/expenses/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Export expenses
   * GET /api/v1/expenses/export
   */
  async exportExpenses(): Promise<any> {
    const response = await api.get('/expenses/export', { responseType: 'blob' });
    return response.data;
  }
};
