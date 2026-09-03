// Generated from OpenAPI Schema

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface DashboardStatsOut {
  companies: number;
  active_companies: number;
  suspended_companies: number;
  users: number;
  active_users: number;
  projects: number;
  active_projects: number;
  plans_count: number;
  subscriptions_count: number;
  subscription_distribution: Record<string, number>;
  expiring_subscriptions: number;
  recent_activity: AuditLogOut[];
}

export interface CompanyOut {
  id: number;
  name: string;
  subdomain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user_count?: number;
  project_count?: number;
  subscription_status?: string;
  plan_name?: string;
}

export interface PlanOut {
  id: number;
  name: string;
  code: string;
  description?: string;
  price: number;
  billing_interval: string;
  currency: string;
  features?: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export interface TenantUserOut {
  id: number;
  tenant_id: string;
  auth_user_id: number;
  role: string;
  designation?: string;
  department?: string;
  employee_id?: string;
  joined_date?: string;
  is_active: boolean;
  created_at: string;
  full_name?: string;
  email?: string;
}

export interface AuditLogOut {
  id: number;
  action: string;
  entity: string;
  entity_id?: number;
  performed_by?: number;
  user_id?: number;
  details?: Record<string, any>;
  created_at: string;
}

export interface ManualPaymentTransactionOut {
  id: number;
  tenant_id: string;
  company_id: number;
  invoice_id?: number;
  plan_id?: number;
  amount: number;
  utr_number: string;
  payment_date: string;
  status: string;
  remarks?: string;
  created_at: string;
  verified_at?: string;
  verified_by?: number;
}

export interface SubscriptionOut {
  id: number;
  company_id: number;
  plan_id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  canceled_at?: string;
  trial_start?: string;
  trial_end?: string;
  created_at: string;
}

export interface EntitlementOut {
  max_users: number;
  max_projects: number;
  max_storage_gb: number;
  features: string[];
}

export interface SubscriptionInvoiceOut {
  id: number;
  company_id: number;
  subscription_id: number;
  invoice_number: string;
  status: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  issued_at?: string;
  due_at?: string;
  paid_at?: string;
  created_at: string;
}

export interface CompanyStatsOut {
  total_users: number;
  active_users: number;
  total_projects: number;
  active_projects: number;
  storage_used_bytes: number;
}

export interface SuperAdminProfileOut {
  id: number;
  email: string;
  full_name: string;
  mobile: string;
  role: string;
  is_active: boolean;
}

export interface PlatformReconciliationOut {
  total_expected_revenue: number;
  total_realized_revenue: number;
  total_outstanding: number;
  pending_manual_transactions: number;
}
