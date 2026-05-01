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
}

export interface CreateLabourRequest {
  aadhaar_number: string;
  labour_name: string;
  skill_type: string;
  daily_wage_rate: number;
  contractor_id: number;
  status: string;
  notes: string;
}

export interface UpdateLabourRequest {
  labour_name?: string;
  skill_type?: string;
  daily_wage_rate?: string | number;
  contractor_id?: number;
  status?: string;
  notes?: string;
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
    labour_category: string;
    check_in_time: string;
    check_out_time: string | null;
    status: string;
    reported_date: string;
    gps_location: string;
    selfie_url: string;
}

export interface AttendanceResponse {
    items: AttendanceRecord[];
    meta?: LabourMeta;
}
