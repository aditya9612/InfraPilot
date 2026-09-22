import api from '../services/api';
import type {
  DashboardStatsOut,
  CompanyOut,
  PaginatedResponse,
  PlanOut,
  TenantUserOut,
  CompanyStatsOut,
  SubscriptionOut,
  EntitlementOut,
  SubscriptionInvoiceOut,
  AuditLogOut,
  ManualPaymentTransactionOut,
  SuperAdminProfileOut
} from '../types/superadmin';

export const superadminService = {
  // PROFILE
  async getProfile(): Promise<SuperAdminProfileOut> {
    const response = await api.get('/superadmin/profile');
    return response.data;
  },
  async updateProfile(data: any): Promise<SuperAdminProfileOut> {
    const response = await api.put('/superadmin/profile', data);
    return response.data;
  },
  async changePassword(data: any) {
    const response = await api.post('/superadmin/change-password', data);
    return response.data;
  },

  // DASHBOARD
  async getDashboardStats(): Promise<DashboardStatsOut> {
    const response = await api.get('/superadmin/dashboard-stats');
    return response.data;
  },

  // COMPANIES
  async getCompanies(params?: { skip?: number; limit?: number; q?: string; is_active?: boolean; subscription_status?: string }): Promise<PaginatedResponse<CompanyOut>> {
    const response = await api.get('/superadmin/companies', { params });
    return response.data;
  },
  async createCompany(data: any): Promise<CompanyOut> {
    const response = await api.post('/superadmin/companies', data);
    return response.data;
  },
  async getCompany(id: string | number): Promise<CompanyOut> {
    const response = await api.get(`/superadmin/companies/${id}`);
    return response.data;
  },
  async updateCompany(id: string | number, data: any): Promise<CompanyOut> {
    const response = await api.put(`/superadmin/companies/${id}`, data);
    return response.data;
  },
  async deleteCompany(id: string | number) {
    const response = await api.delete(`/superadmin/companies/${id}`);
    return response.data;
  },
  async updateCompanyStatus(id: string | number, data: { is_active: boolean; reason?: string }): Promise<CompanyOut> {
    const response = await api.put(`/superadmin/companies/${id}/status`, data);
    return response.data;
  },
  async activateCompany(id: string | number): Promise<CompanyOut> {
    const response = await api.post(`/superadmin/companies/${id}/activate`);
    return response.data;
  },
  async suspendCompany(id: string | number): Promise<CompanyOut> {
    const response = await api.post(`/superadmin/companies/${id}/suspend`);
    return response.data;
  },

  // COMPANY SPECIFIC
  async getCompanyStats(companyId: string | number): Promise<CompanyStatsOut> {
    const response = await api.get(`/superadmin/companies/${companyId}/stats`);
    return response.data;
  },
  async getCompanyUsers(companyId: string | number, params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<TenantUserOut>> {
    const response = await api.get(`/superadmin/companies/${companyId}/users`, { params });
    return response.data;
  },
  async createCompanyAdmin(companyId: string | number, data: any): Promise<TenantUserOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/admin`, data);
    return response.data;
  },
  async getCompanyUser(companyId: string | number, userId: string | number): Promise<TenantUserOut> {
    const response = await api.get(`/superadmin/companies/${companyId}/users/${userId}`);
    return response.data;
  },
  async updateCompanyUserStatus(companyId: string | number, userId: string | number, status: string | boolean): Promise<TenantUserOut> {
    const is_active = typeof status === 'boolean' ? status : status === 'active';
    const response = await api.put(`/superadmin/companies/${companyId}/users/${userId}/status`, { is_active, status: is_active ? 'active' : 'inactive' });
    return response.data;
  },
  async activateCompanyUser(companyId: string | number, userId: string | number): Promise<TenantUserOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/users/${userId}/activate`);
    return response.data;
  },
  async deactivateCompanyUser(companyId: string | number, userId: string | number): Promise<TenantUserOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/users/${userId}/deactivate`);
    return response.data;
  },

  // PLANS
  async getPlans(): Promise<PlanOut[]> {
    const response = await api.get('/superadmin/plans');
    return response.data;
  },
  async createPlan(data: any): Promise<PlanOut> {
    const response = await api.post('/superadmin/plans', data);
    return response.data;
  },
  async getPlan(id: string | number): Promise<PlanOut> {
    const response = await api.get(`/superadmin/plans/${id}`);
    return response.data;
  },
  async updatePlan(id: string | number, data: any): Promise<PlanOut> {
    const response = await api.put(`/superadmin/plans/${id}`, data);
    return response.data;
  },
  async deletePlan(id: string | number) {
    const response = await api.delete(`/superadmin/plans/${id}`);
    return response.data;
  },

  // SUBSCRIPTIONS & ENTITLEMENTS
  async getCompanySubscription(companyId: string | number): Promise<SubscriptionOut> {
    const response = await api.get(`/superadmin/companies/${companyId}/subscription`);
    return response.data;
  },
  async createCompanySubscription(companyId: string | number, data: any): Promise<SubscriptionOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/subscription`, data);
    return response.data;
  },
  async updateCompanySubscription(companyId: string | number, data: any): Promise<SubscriptionOut> {
    const response = await api.put(`/superadmin/companies/${companyId}/subscription`, data);
    return response.data;
  },
  async activateCompanySubscription(companyId: string | number): Promise<SubscriptionOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/subscription/activate`);
    return response.data;
  },
  async suspendCompanySubscription(companyId: string | number): Promise<SubscriptionOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/subscription/suspend`);
    return response.data;
  },
  async cancelCompanySubscription(companyId: string | number): Promise<SubscriptionOut> {
    const response = await api.post(`/superadmin/companies/${companyId}/subscription/cancel`);
    return response.data;
  },
  async getCompanyEntitlements(companyId: string | number): Promise<EntitlementOut> {
    const response = await api.get(`/superadmin/companies/${companyId}/entitlements`);
    return response.data;
  },

  // MANUAL UPI PAYMENTS
  async getManualPayments(params?: { skip?: number; limit?: number; status?: string }): Promise<PaginatedResponse<ManualPaymentTransactionOut>> {
    const response = await api.get('/superadmin/manual-payments', { params });
    return response.data;
  },
  async verifyManualPayment(transactionId: string | number): Promise<ManualPaymentTransactionOut> {
    const response = await api.post(`/superadmin/manual-payments/${transactionId}/verify`);
    return response.data;
  },
  async rejectManualPayment(transactionId: string | number, data: any): Promise<ManualPaymentTransactionOut> {
    const response = await api.post(`/superadmin/manual-payments/${transactionId}/reject`, data);
    return response.data;
  },

  // BILLING / INVOICES
  async getPlatformReconciliation() {
    const response = await api.get('/superadmin/billing/reconciliation');
    return response.data;
  },
  async getCompanyReconciliation(companyId: string | number) {
    const response = await api.get(`/superadmin/companies/${companyId}/billing/reconciliation`);
    return response.data;
  },
  async getCompanyBillingEvents(companyId: string | number, params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<any>> {
    const response = await api.get(`/superadmin/companies/${companyId}/billing-events`, { params });
    return response.data;
  },
  async getCompanyInvoices(companyId: string | number, params?: { skip?: number; limit?: number }): Promise<PaginatedResponse<SubscriptionInvoiceOut>> {
    const response = await api.get(`/superadmin/companies/${companyId}/invoices`, { params });
    return response.data;
  },

  // AUDIT LOGS
  async getAuditLogs(params?: {
    skip?: number;
    limit?: number;
    offset?: number;
    entity?: string;
    action?: string;
    performed_by?: string | number;
    q?: string;
  }): Promise<PaginatedResponse<AuditLogOut>> {
    const response = await api.get('/superadmin/audit-logs', { params });
    return response.data;
  },
  async getCompanyAuditLogs(
    companyId: string | number,
    params?: {
      skip?: number;
      limit?: number;
      offset?: number;
      entity?: string;
      action?: string;
      performed_by?: string | number;
    }
  ): Promise<PaginatedResponse<AuditLogOut>> {
    const response = await api.get(`/superadmin/companies/${companyId}/audit-logs`, { params });
    return response.data;
  }
};
