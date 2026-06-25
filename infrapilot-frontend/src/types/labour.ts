export interface LabourItem {
  id: number;
  worker_code: string;
  user_id: number | null;
  role: string | null;
  aadhaar_number: string;
  labour_name: string;
  mobile_number: string | null;
  pan_number: string | null;
  address: string | null;
  email: string | null;
  profile_image: string | null;
  labour_type_id: number | null;
  labour_type_name: string | null;
  skill_category: string | null;
  default_daily_wage: number | null;
  custom_daily_wage_rate: number | null;
  custom_ot_rate_per_hour: number | null;
  effective_daily_wage: number | null;
  effective_ot_rate: number | null;
  contractor_id: number | null;
  contractor_name: string | null;
  status: string;
  notes: string | null;
  // legacy / UI helpers
  skill_type?: string;
  daily_wage_rate?: string | number;
  project_id?: number | null;
  projects?: any[];
}

export interface CreateLabourRequest {
  aadhaar_number: string;
  labour_name: string;
  skill_type: string;
  daily_wage_rate: number;
  contractor_id: number;
  status: string;
  notes: string;
  mobile_number?: string;
}

export interface UpdateLabourRequest {
  labour_name?: string;
  skill_type?: string;
  daily_wage_rate?: string | number;
  contractor_id?: number;
  status?: string;
  notes?: string;
  mobile_number?: string;
}

export interface LabourMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface LabourResponse {
  items: LabourItem[];
  meta: LabourMeta;
}
export interface AttendanceRecord {
    id: number;
    labour_id: number;
    labour_name: string;
    worker_code: string;
    attendance_date: string;
    in_time: string;
    out_time: string | null;
    working_hours: number;
    overtime_hours: number;
    task_id: string | null;
    check_in_address: string;
    check_out_address: string | null;
    check_in_image: string | null;
    check_out_image: string | null;
    status: string;
    task_description?: string;
    total_wage?: number;
    overtime_rate?: number;
    attendance_id?: number | string;
    contractor_id?: number;
    // UI specific
    selfie_url?: string;
}

export interface AttendanceResponse {
    items: AttendanceRecord[];
    total: number;
    limit: number;
    offset: number;
}

export interface CheckInRequest {
    labour_id: number;
    project_id: number;
    task_id?: string;
    latitude: number;
    longitude: number;
    location_address: string;
    resolved_address?: string;
    task_description: string;
    remarks?: string;
    work_location_type?: string;
    check_in_image: string | null;
}

export interface CheckOutRequest {
    latitude: number;
    longitude: number;
    location_address: string;
    resolved_address?: string;
    overtime_hours: number;
    overtime_rate: number;
    remarks?: string;
    work_summary?: string;
    task_deadline_reason?: string;
    check_out_image: string | null;
}
