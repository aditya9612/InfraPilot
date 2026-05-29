export interface ActivityItem {
  id: number;
  activity_name: string;
  unit: string;
  total_completed: number;
  completion_percentage: number;
  start_date: string;
  created_at: string;
  boq_code: number | null;
  project_id: number;
  planned_quantity: number;
  engineer_id: number;
  remaining_quantity: number;
  status: string;
  end_date: string;
  work_order_id?: number | null;
  discipline?: string | null;
  updated_at?: string;
}

export interface DailyEntry {
  id: number;
  activity_id: number;
  entry_date: string;
  today_progress: number;
  remarks: string;
  created_by: number;
  created_at: string;
  updated_at?: string;
}

export interface ProjectSummary {
  total_activities: number;
  completed_activities: number;
  delayed_activities: number;
}

export interface CreateActivityRequest {
  project_id: number;
  boq_code?: number | null;
  activity_name: string;
  planned_quantity: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
  engineer_id: number;
  work_order_id?: number | null;
}

export interface UpdateActivityRequest {
  activity_name: string;
  planned_quantity: number;
  unit: string;
  start_date: string;
  end_date: string;
  status: string;
}

export interface DailyProgressRequest {
  activity_id: number;
  entry_date: string;
  today_progress: number;
  remarks: string;
  created_by: number;
}
