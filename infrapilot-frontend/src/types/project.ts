import type { UserRole } from "./user";

export type ProjectStatus =
  | "Planned"
  | "Active"
  | "Delayed"
  | "Completed"
  | "On Hold";
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
  budget?: number;
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

export type RateType = "lumpsum" | "measured" | "others";

export interface ProjectExpense {
  id: number;
  project_id: number;
  date: string;
  category: "Labour" | "Material" | "Permits" | "Tools" | "Other";
  amount: number;
  description: string;
  status: "Paid" | "Pending";
}

export interface ProfitLoss {
  project_id: number;
  total_invoice: number;
  total_expense: number;
  profit: number;
  status: "profit" | "loss";
}

export interface ContractorBill {
  id: number;
  contractor_id: number;
  memo: string;
  amount: number;
  date: string;
  status: "pending" | "approved" | "rejected";
}

export interface ContractorPayment {
  id: number;
  contractor_id: number;
  amount: number;
  date: string;
  method: string;
  reference?: string;
}

export interface Contractor {
  id: number;
  contractor_id: string; // Internal system ID
  name: string;
  company: string;
  email: string;
  work_type: string;
  contact_number: string;
  gst_number: string;
  rate_type: RateType;
  total_work_assigned: number;
  payment_given: number;
  bank_details: string;
  project_id?: number;
  rating?: number;
  status?: "Active" | "Delayed" | "Inactive";
  bills?: ContractorBill[];
  payments?: ContractorPayment[];
}
