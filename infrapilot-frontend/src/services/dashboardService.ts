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

export interface AdminDashboardData {
  project_overview: {
    total: number;
    active: number;
    completed: number | string;
    delayed: number | string;
  };
  financial: {
    revenue: number;
    expense: number;
    profit: number;
  };
  vitals: {
    total_labour_today: number;
    pending_approvals: number;
    action_items: number;
    material_used_today: number;
    site_issues_open: number;
  };
  active_users: number;
  discipline_progress: {
    discipline: string;
    planned_percent: number;
    actual_percent: number;
  }[];
  master_projects: {
    id: number;
    name: string;
    start_date: string;
    end_date: string;
    progress: number;
    performance_score: number;
    health: string;
  }[];
  recent_activities: {
    type: string;
    user: string;
    description: string;
    time: string;
    project_name: string;
  }[];
  kpi_comparison: {
    current_month: number;
    previous_month: number;
    difference: number;
  };
}

export interface LabourDashboardResponse {
  // Primary field names
  total_tasks?: number;
  completed_tasks?: number;
  pending_tasks?: number;
  earnings_current_month?: number;
  tasks?: any[];
  // Alternative field names the API may use
  total?: number;
  completed?: number;
  pending?: number;
  tasks_total?: number;
  tasks_completed?: number;
  tasks_pending?: number;
  earnings?: number;
  total_earnings?: number;
  recent_tasks?: any[];
  assigned_tasks?: any[];
  // Recent activity (confirmed in API response)
  recent_activity?: { title: string; description: string; time: string }[];
  recent_activities?: { title: string; description: string; time: string }[];
  // Allow additional properties
  [key: string]: any;
}

// --------------- PM Command Center Types ---------------
export interface PMCommandCenterData {
  header_date: string;
  kpis: {
    total_managed_projects: number;
    active_site_deployments: number;
    avg_completion_percent: number;
    delayed_sites_count: number;
    pending_reviews_count: number;
  };
  project_performance: {
    id: number;
    name: string;
    business_id: string;
    progress: number;
    status: string;
    start_date: string;
    end_date: string;
    budget_utilization_actual: number;
    budget_utilization_total: number;
  }[];
  quality_score: number;
  safety_score: number;
  cost_tracking: {
    month: string;
    actual_cost: number;
    budget: number;
  }[];
  risk_analysis: {
    project_name: string;
    risk_type: string;
    priority: string;
    status: string;
  }[];
  critical_alerts: {
    id: number;
    alert_type: string;
    message: string;
    project_name: string;
    timestamp: string;
  }[];
  task_management: {
    id: number;
    task_name: string;
    engineer_name: string;
    status: string;
    due_date: string | null;
  }[];
  recent_activities: any[];
}

export interface PMSummaryData {
  total_projects: number;
  active_projects: number;
  completed_projects: number;
  delayed_projects: number;
  pending_approvals: number;
  open_issues: number;
  budget_utilized_percent: number;
  todays_activities: number;
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
   * Get Admin Dashboard stats
   * GET /api/v1/dashboard/admin
   */
  async getAdminDashboard(): Promise<AdminDashboardData> {
    const response = await api.get<AdminDashboardData>('/dashboard/admin');
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

  /**
   * Labour Dashboard
   * GET /api/v1/dashboard/labour
   */
  async getLabourDashboard(): Promise<LabourDashboardResponse> {
    const response = await api.get<any>('dashboard/labour');
    const raw = response.data;
    console.log('GET /api/v1/dashboard/labour RAW Response:', JSON.stringify(raw, null, 2));
    // Handle possible data wrapper from backend
    const data = raw?.data || raw;
    return data;
  },

  /**
   * PM Command Center
   * GET /api/v1/dashboard/pm-command-center
   */
  async getPMCommandCenter(): Promise<PMCommandCenterData> {
    const response = await api.get<PMCommandCenterData>('/dashboard/pm-command-center');
    return response.data;
  },

  /**
   * PM Summary
   * GET /api/v1/dashboard/project-manager-summary
   */
  async getPMSummary(): Promise<PMSummaryData> {
    const response = await api.get<PMSummaryData>('/dashboard/project-manager-summary');
    return response.data;
  },

  /**
   * Labour Payments
   * GET /api/v1/dashboard/labour/payments
   */
  async getLabourPayments(params?: {
    month?: number;
    year?: number;
    time_filter?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const response = await api.get<any>('dashboard/labour/payments', { params });
    const raw = response.data;
    console.log('GET /api/v1/dashboard/labour/payments RAW Response:', JSON.stringify(raw, null, 2));
    return raw?.data || raw;
  },

  /**
   * Labour Payments Export
   * GET /api/v1/dashboard/labour/payments/export/{format}
   */
  async exportLabourPayments(format: 'pdf' | 'excel', params?: {
    month?: number;
    year?: number;
    time_filter?: string;
  }): Promise<Blob> {
    const response = await api.get(`/dashboard/labour/payments/export/${format}`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};
