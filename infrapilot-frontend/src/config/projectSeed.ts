import type { Project, ProjectMember, Milestone, Task, TaskComment, TaskProgress, ProfitLoss, ProjectExpense } from "../types/project";

export const PROJECTS: Project[] = [
  {
    id: 1,
    project_name: "SARA CITY",
    owner_id: 1,
    description: "Wing A Construction - Premium Residential Complex",
    start_date: "2026-04-02",
    end_date: "2027-12-31",
    status: "Active",
    completion_percentage: 15,
    budget: 45000000,
  },
  {
    id: 2,
    project_name: "METRO HEIGHTS",
    owner_id: 2,
    description: "Commercial Hub and Office Spaces",
    start_date: "2026-01-15",
    end_date: "2028-06-30",
    status: "Delayed",
    completion_percentage: 45,
    budget: 82000000,
  },
  {
    id: 3,
    project_name: "GREEN GARDENS",
    owner_id: 1,
    description: "Eco-friendly Villa Project",
    start_date: "2026-05-01",
    end_date: "2027-05-01",
    status: "Planned",
    completion_percentage: 0,
    budget: 25000000,
  },
  {
    id: 4,
    project_name: "SKYLINE TOWERS",
    owner_id: 2,
    description: "Multi-storey residential project - Phase 2",
    start_date: "2026-06-15",
    end_date: "2029-12-31",
    status: "On Hold",
    completion_percentage: 10,
    budget: 120000000,
  }
];

export const PROJECT_MEMBERS: Record<number, ProjectMember[]> = {
  1: [
    { user_id: 1, full_name: "Admin User", email: "admin@test.com", role: "Admin" },
    { user_id: 2, full_name: "Rajesh Kumar", email: "rajesh@infraservices.com", role: "Project Manager" },
    { user_id: 4, full_name: "Anil Sharma", email: "anil.s@site.com", role: "Site Engineer" }
  ],
  2: [
    { user_id: 1, full_name: "Admin User", email: "admin@test.com", role: "Admin" },
    { user_id: 3, full_name: "Priya Singh", email: "priya@manager.com", role: "Project Manager" }
  ]
};

export const MILESTONES: Record<number, Milestone[]> = {
  1: [
    { id: 1, project_id: 1, title: "Excavation", description: "Site clearing and soil excavation", start_date: "2026-04-01", end_date: "2026-04-05", status: "Completed" },
    { id: 2, project_id: 1, title: "Foundation", description: "Footing, PCC, and base structure", start_date: "2026-04-06", end_date: "2026-05-15", status: "In Progress" },
    { id: 3, project_id: 1, title: "Column Casting", description: "First floor column structural work", start_date: "2026-05-16", end_date: "2026-06-30", status: "Pending" }
  ]
};

export const TASKS: Record<number, Task[]> = {
  1: [
    { id: 1, project_id: 1, title: "Site Cleaning", description: "Remove debris and level ground", priority: 1, status: "Completed", start_date: "2026-04-01", end_date: "2026-04-02", assigned_user_id: 4, completion_percentage: 100, is_delayed: false },
    { id: 2, project_id: 1, title: "Soil Testing", description: "Collect and analyze soil samples", priority: 2, status: "Completed", start_date: "2026-04-03", end_date: "2026-04-04", assigned_user_id: 4, completion_percentage: 100, is_delayed: false },
    { id: 3, project_id: 1, title: "Excavation Work", description: "Primary trenching for foundation", priority: 1, status: "Completed", start_date: "2026-04-05", end_date: "2026-04-10", assigned_user_id: 4, completion_percentage: 100, is_delayed: false },
    { id: 4, project_id: 1, title: "PCC Laying", description: "Plain Cement Concrete for base", priority: 2, status: "In Progress", start_date: "2026-04-11", end_date: "2026-04-15", assigned_user_id: 4, completion_percentage: 60, is_delayed: false },
    { id: 5, project_id: 1, title: "Reinforcement Tying", description: "Steel bar placement for footing", priority: 1, status: "Planned", start_date: "2026-04-16", end_date: "2026-04-20", assigned_user_id: 4, completion_percentage: 0, is_delayed: false }
  ],
  2: [
    { id: 6, project_id: 2, title: "Market Survey", description: "Analyze competitor commercial spaces", priority: 2, status: "Completed", start_date: "2026-01-15", end_date: "2026-01-25", assigned_user_id: 3, completion_percentage: 100, is_delayed: false },
    { id: 7, project_id: 2, title: "Architectural Design", description: "Finalize hub structural blueprints", priority: 1, status: "Completed", start_date: "2026-01-26", end_date: "2026-02-28", assigned_user_id: 3, completion_percentage: 100, is_delayed: false },
    { id: 8, project_id: 2, title: "Liaison & Approvals", description: "Get municipal corporation clearance", priority: 1, status: "In Progress", start_date: "2026-03-01", end_date: "2026-06-30", assigned_user_id: 3, completion_percentage: 40, is_delayed: true }
  ],
  3: [
    { id: 9, project_id: 3, title: "Land Survey", description: "Topographical mapping of villa land", priority: 1, status: "Planned", start_date: "2026-05-01", end_date: "2026-05-10", assigned_user_id: 1, completion_percentage: 0, is_delayed: false }
  ]
};

export const TASK_PROGRESS: Record<number, TaskProgress[]> = {
  4: [
    { id: 1, task_id: 4, percentage: 30, remarks: "PCC work started on North Quadrant", created_at: "2026-04-11T10:00:00" },
    { id: 2, task_id: 4, percentage: 60, remarks: "50% of the base area covered", created_at: "2026-04-12T14:30:00" }
  ]
};

export const TASK_COMMENTS: Record<number, TaskComment[]> = {
  4: [
    { id: 1, task_id: 4, author_user_id: 2, author_name: "Rajesh Kumar", content: "Ensure the mix ratio is strictly 1:4:8 as per specs.", created_at: "2026-04-11T11:00:00" },
    { id: 2, task_id: 4, author_user_id: 4, author_name: "Anil Sharma", content: "Roger that. Mixer is calibrated.", created_at: "2026-04-11T11:15:00" }
  ]
};

export const PROFIT_LOSS_DATA: Record<number, ProfitLoss> = {
  1: { project_id: 1, total_invoice: 15000000, total_expense: 12000000, profit: 3000000, status: "profit" },
  2: { project_id: 2, total_invoice: 8000000, total_expense: 9500000, profit: 1500000, status: "loss" }
};

export const PROJECT_EXPENSES: Record<number, ProjectExpense[]> = {
  1: [
    { id: 1, project_id: 1, date: "2026-04-03", category: "Permits", amount: 45000, description: "Environmental clearance fee", status: "Paid" },
    { id: 2, project_id: 1, date: "2026-04-05", category: "Tools", amount: 125000, description: "Excavator rental for foundation", status: "Paid" },
    { id: 3, project_id: 1, date: "2026-04-10", category: "Material", amount: 840000, description: "500 bags of Portland Cement", status: "Paid" },
    { id: 4, project_id: 1, date: "2026-04-12", category: "Labour", amount: 65000, description: "Weekly payout for site digging team", status: "Pending" }
  ],
  2: [
    { id: 5, project_id: 2, date: "2026-01-20", category: "Permits", amount: 250000, description: "Commercial land use conversion fee", status: "Paid" },
    { id: 6, project_id: 2, date: "2026-02-15", category: "Other", amount: 55000, description: "Architectural consultation fee", status: "Paid" }
  ]
};
