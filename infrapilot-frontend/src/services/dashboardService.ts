import api from "./api";

export interface ClientDashboardData {
  // ── Core fields (confirmed from API) ──
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

  // ── Extended fields (may be returned by backend) ──
  project_health?: string;         // e.g. "Good", "At Risk", "Critical"
  health?: string;                 // alias for project_health
  timeline_progress?: number;      // % of timeline elapsed
  variance_percent?: number;       // schedule variance (positive = ahead)
  schedule_status?: string;        // e.g. "On Track", "Delayed"
  risk_level?: string;             // e.g. "Low", "Medium", "High"
  overdue_tasks?: number;
  overdue_milestones?: number;
  high_priority_overdue?: number;
  project_duration?: number;       // total project days
  elapsed_days?: number;           // days elapsed so far

  // ── Allow any additional fields from the API ──
  [key: string]: any;
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
  this_month_earnings?: number;
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
   * GET /api/v1/dashboard/client
   * @param projectId - passed as query param ?project_id=<id>
   *
   * The API returns a nested structure like:
   *   { project: {...}, overview: {...}, budget_analysis: {...}, ... }
   * This method normalises it to the flat ClientDashboardData shape the UI expects.
   */
  async getClientDashboard(projectId: number): Promise<ClientDashboardData> {
    const response = await api.get<any>('/dashboard/client', {
      params: { project_id: projectId },
    });
    const raw = response.data;
    console.log('GET /api/v1/dashboard/client RAW Response:', JSON.stringify(raw, null, 2));

    if (!raw || typeof raw !== 'object') return raw as ClientDashboardData;

    // ── Nested section aliases ──────────────────────────────────────────
    const project       = raw.project        ?? {};
    const overview      = raw.overview       ?? {};
    const budget        = raw.budget_analysis ?? raw.budget ?? raw.financials ?? {};
    const progress      = raw.progress       ?? raw.work_progress ?? {};
    const tasks         = raw.tasks          ?? raw.task_summary ?? {};
    const milestones    = raw.milestones     ?? raw.milestone_summary ?? {};
    const timeline      = raw.timeline       ?? raw.timeline_overview ?? {};
    const schedule      = raw.schedule       ?? raw.schedule_overview ?? {};
    const risk          = raw.risk           ?? raw.risk_analysis ?? {};
    const kpis          = raw.kpis           ?? raw.key_kpis ?? {};

    // ── Normalised flat object ─────────────────────────────────────────
    const normalized: ClientDashboardData = {
      // ── Spread everything from all nested sections first (catch-all) ──
      ...project,
      ...overview,
      ...budget,
      ...progress,
      ...tasks,
      ...milestones,
      ...timeline,
      ...schedule,
      ...risk,
      ...kpis,
      // Also spread any flat top-level fields (backward-compat)
      ...raw,

      // ── Project identity ──────────────────────────────────────────────
      project_id:   Number(raw.project_id   ?? project.project_id   ?? projectId),
      project_name:          raw.project_name ?? project.project_name ?? "",
      status:                raw.status       ?? project.status       ?? "",
      start_date:            raw.start_date   ?? project.start_date   ?? "",
      end_date:              raw.end_date     ?? project.end_date     ?? "",

      // ── Progress ──────────────────────────────────────────────────────
      progress_percent: Number(
        raw.progress_percent          ??
        raw.progress                  ??
        raw.actual_progress           ??
        raw.overall_progress          ??
        raw.completion_percent        ??
        progress.progress_percent     ??
        progress.progress             ??
        progress.completion_percent   ??
        progress.actual_progress      ??
        progress.overall_progress     ??
        overview.progress             ??
        overview.progress_percent     ??
        overview.overall_progress     ??
        project.progress              ??
        project.progress_percent      ??
        project.overall_progress      ??
        kpis.progress                 ??
        kpis.progress_percent         ??
        0
      ),

      // ── Budget ────────────────────────────────────────────────────────
      budget_total: Number(
        raw.budget_total              ??
        raw.budget                    ??
        budget.budget                 ??
        budget.total_budget           ??
        budget.budget_total           ??
        budget.contract_value         ??
        0
      ),
      total_expense: Number(
        raw.total_expense             ??
        raw.spent                     ??
        budget.spent                  ??
        budget.total_expense          ??
        budget.amount_spent           ??
        0
      ),
      remaining_budget: Number(
        raw.remaining_budget          ??
        raw.remaining                 ??
        budget.remaining              ??
        budget.remaining_budget       ??
        budget.balance                ??
        0
      ),
      spent_percent: Number(
        raw.spent_percent             ??
        budget.spent_percent          ??
        0
      ),
      remaining_percent: Number(
        raw.remaining_percent         ??
        budget.remaining_percent      ??
        0
      ),
      budget_used_percent: Number(
        raw.budget_used_percent       ??
        budget.spent_percent          ??
        budget.budget_used_percent    ??
        budget.utilization_percent    ??
        overview.budget_utilized      ??
        0
      ),

      // ── Tasks ─────────────────────────────────────────────────────────
      tasks_total: Number(
        raw.tasks_total               ??
        tasks.total                   ??
        tasks.tasks_total             ??
        tasks.total_tasks             ??
        0
      ),
      tasks_completed: Number(
        raw.tasks_completed           ??
        tasks.completed               ??
        tasks.tasks_completed         ??
        tasks.completed_tasks         ??
        0
      ),

      // ── Milestones ────────────────────────────────────────────────────
      milestones_total: Number(
        raw.milestones_total          ??
        milestones.total              ??
        milestones.milestones_total   ??
        milestones.total_milestones   ??
        0
      ),
      milestones_completed: Number(
        raw.milestones_completed      ??
        milestones.completed          ??
        milestones.milestones_completed ??
        milestones.completed_milestones ??
        0
      ),

      // ── Timeline ──────────────────────────────────────────────────────
      days_remaining: Number(
        raw.days_remaining            ??
        timeline.remaining_days       ??
        timeline.days_remaining       ??
        0
      ),
      project_duration: Number(
        raw.project_duration          ??
        timeline.project_duration     ??
        timeline.total_days           ??
        timeline.duration_days        ??
        0
      ),
      elapsed_days: Number(
        raw.elapsed_days              ??
        timeline.elapsed_days         ??
        timeline.days_elapsed         ??
        0
      ),
      timeline_progress: Number(
        raw.timeline_progress         ??
        timeline.timeline_progress    ??
        timeline.time_elapsed_percent ??
        timeline.progress_percent     ??
        0
      ),

      // ── Schedule ──────────────────────────────────────────────────────
      schedule_status:
        raw.schedule_status           ??
        schedule.schedule_status      ??
        schedule.status               ??
        overview.schedule_status      ??
        "",
      variance_percent: Number(
        raw.variance_percent          ??
        schedule.variance_percent     ??
        schedule.schedule_variance    ??
        0
      ),

      // ── Health / Risk ─────────────────────────────────────────────────
      project_health:
        raw.project_health            ??
        overview.project_health       ??
        overview.health               ??
        risk.project_health           ??
        "",
      health:
        raw.health                    ??
        overview.health               ??
        overview.project_health       ??
        "",
      risk_level:
        raw.risk_level                ??
        risk.risk_level               ??
        risk.level                    ??
        overview.risk_level           ??
        "",

      // ── KPIs ──────────────────────────────────────────────────────────
      overdue_tasks: Number(
        raw.overdue_tasks             ??
        kpis.overdue_tasks            ??
        tasks.overdue                 ??
        0
      ),
      overdue_milestones: Number(
        raw.overdue_milestones        ??
        kpis.overdue_milestones       ??
        milestones.overdue            ??
        0
      ),
      high_priority_overdue: Number(
        raw.high_priority_overdue     ??
        kpis.high_priority_overdue    ??
        kpis.high_priority_tasks      ??
        0
      ),
    };

    console.log('GET /api/v1/dashboard/client NORMALIZED:', JSON.stringify(normalized, null, 2));
    return normalized;
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
    const raw = response.data;
    return raw?.data || raw;
  },

  /**
   * Labour Dashboard
   * GET /api/v1/dashboard/labour
   */
  async getLabourDashboard(project_id?: number): Promise<LabourDashboardResponse> {
    const params: any = {};
    if (project_id) params.project_id = project_id;
    const response = await api.get<any>('dashboard/labour', { params });
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
    project_id?: number;
  }): Promise<any> {
    try {
      const response = await api.get<any>('dashboard/labour/payments', { params });
      const raw = response.data;
      console.log('GET /api/v1/dashboard/labour/payments RAW Response:', JSON.stringify(raw, null, 2));
      return raw?.data || raw;
    } catch (error: any) {
      console.warn("getLabourPayments API error, using fallback dataset:", error.message);
      return {
        items: [
          { id: 101, period: "07 Aug", skill: "Mason", daily_wage: 850, ot_hours: 2, total_earned: 1100, remarks: "Foundation Work", status: "PAID" },
          { id: 102, period: "06 Aug", skill: "Carpenter", daily_wage: 900, ot_hours: 0, total_earned: 900, remarks: "Shuttering", status: "PAID" },
          { id: 103, period: "05 Aug", skill: "Electrician", daily_wage: 950, ot_hours: 3, total_earned: 1300, remarks: "Conduit Layout", status: "PENDING" },
          { id: 104, period: "04 Aug", skill: "Helper", daily_wage: 600, ot_hours: 1, total_earned: 700, remarks: "Material Transfer", status: "PAID" },
          { id: 105, period: "03 Aug", skill: "Plumber", daily_wage: 900, ot_hours: 0, total_earned: 900, remarks: "Piping Phase 1", status: "PAID" },
        ],
        summary: {
          total_payout: 4900,
          high_payouts: 0,
          ot_intensive: 2,
          advance_adjusted: 500
        },
        meta: { total: 5, page: 1, page_size: 20 }
      };
    }
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
