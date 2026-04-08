import type { UserRole } from "./user";

export type ProjectStatus = "Planned" | "Active" | "Delayed" | "Completed" | "On Hold";
export type TaskStatus = "Planned" | "In Progress" | "Completed" | "Delayed";
export type MilestoneStatus = "Pending" | "In Progress" | "Completed";

export interface Project {
  id: number;
  project_name: string;
  owner_id: number;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
  completion_percentage: number;
}

export interface ProjectMember {
  user_id: number;
  full_name: string;
  email: string;
  role: UserRole;
}

export interface Milestone {
  id: number;
  project_id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status?: MilestoneStatus;
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string;
  priority: number;
  status: TaskStatus;
  start_date: string;
  end_date: string;
  assigned_user_id: number;
  completion_percentage: number;
  is_delayed: boolean;
}

export interface TaskProgress {
  id: number;
  task_id: number;
  percentage: number;
  remarks: string;
  created_at: string;
}

export interface TaskComment {
  id: number;
  task_id: number;
  author_user_id: number;
  author_name?: string;
  content: string;
  created_at?: string;
}

export interface ProfitLoss {
  project_id: number;
  total_invoice: number;
  total_expense: number;
  profit: number;
  status: "profit" | "loss";
}

export type RateType = "lumpsum" | "measured" | "others";

export interface Contractor {
  id: number;
  contractor_id: string;
  name: string;
  work_type: string;
  contact_number: string;
  gst_number: string;
  rate_type: RateType;
  total_work_assigned: number;
  payment_given: number;
  bank_details: string;
}
