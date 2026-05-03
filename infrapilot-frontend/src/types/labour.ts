export interface LabourItem {
  id: number;
  worker_code: string;
  aadhaar_number: string;
  labour_name: string;
  skill_type: string;
  daily_wage_rate: string | number;
  contractor_id: number;
  status: string;
  notes: string;
  mobile_number?: string;
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
    task_description: string;
    check_in_image: string | null;
}

export interface CheckOutRequest {
    latitude: number;
    longitude: number;
    location_address: string;
    overtime_hours: number;
    overtime_rate: number;
    check_out_image: string | null;
}
