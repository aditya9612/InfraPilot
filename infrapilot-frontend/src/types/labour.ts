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
