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

export interface ClientCommandCenterData {
  project: {
    id: number;
    name: string;
    status: string;
    start_date: string;
    end_date: string;
    days_remaining: number;
  };
  summary: {
    overall_progress: number;
    budget_total: number;
    total_expense: number;
    remaining_budget: number;
    budget_used_percent: number;
    tasks: {
      completed: number;
      pending: number;
      total: number;
    };
    milestones: {
      completed: number;
      total: number;
    };
  };
  work_progress: {
    progress_percent: number;
    current_task: string | null;
    task_description: string | null;
    task_status: string | null;
    last_completed: string | null;
    upcoming: string | null;
  };
  live_execution_feed: {
    id: number;
    action: string;
    entity: string;
    created_at: string;
  }[];
  cost_management_audit: any[];
  project_health: {
    status: string;
    overall_progress: number;
    budget_health: string;
    schedule_health: string;
    task_completion_rate: number;
    budget_used_percent: number;
  };
}

export interface EnterpriseDashboardResponse {
  success: boolean;
  message: string;
  data: ClientCommandCenterData;
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

export interface LabourDashboardData {
  user_name: string;
  project_name: string | null;
  contractor_name: string;
  check_in_status: string;
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  this_month_earnings: number;
  recent_tasks: any[];
  recent_activity: any[];
}

export interface LabourDashboardResponse {
  success: boolean;
  message: string;
  data: LabourDashboardData;
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
   * Get Client Command Center stats (Enterprise Dashboard)
   * GET /api/v1/dashboard/client-command-center
   */
  async getClientCommandCenter(projectId: number): Promise<EnterpriseDashboardResponse> {
    const response = await api.get<EnterpriseDashboardResponse>(`/dashboard/client-command-center`, {
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
   * Get Labour Dashboard stats
   * GET /api/v1/dashboard/labour
   */
  async getLabourDashboard(): Promise<LabourDashboardResponse> {
    const response = await api.get<LabourDashboardResponse>('/dashboard/labour');
    return response.data;
  },
};
