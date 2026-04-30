export interface DsrItem {
  id: number;
  project_id: number;
  report_date: string;
  site_location: string;
  contractor_id: number;
  contractor_name?: string;
  weather: string;
  work_done: string;
  work_planned: string;
  machinery_used: string;
  material_received: string;
  material_used: string;
  issues: string;
  safety_observations: string;
  remarks: string;
  latitude: number;
  longitude: number;
  business_id?: string;
  status?: string;
  report_type?: "Daily" | "Weekly" | "Monthly";
  resolved_address?: string;
  total_labour?: number;
  skilled_labour?: number;
  unskilled_labour?: number;
  created_at?: string;
  updated_at?: string;
  created_by_id?: number;
  created_by_name?: string;
}

export interface CreateDsrRequest {
  project_id: number;
  report_date: string;
  site_location: string;
  contractor_id: number;
  weather: string;
  work_done: string;
  work_planned: string;
  machinery_used: string;
  material_received: string;
  material_used: string;
  issues: string;
  safety_observations: string;
  remarks: string;
  latitude: number;
  longitude: number;
}

export interface UpdateDsrRequest {
  report_date?: string;
  site_location?: string;
  contractor_id?: number;
  weather?: string;
  work_done?: string;
  work_planned?: string;
  machinery_used?: string;
  material_received?: string;
  material_used?: string;
  issues?: string;
  safety_observations?: string;
  remarks?: string;
  latitude?: number;
  longitude?: number;
}

export interface DsrMeta {
  total: number;
  limit: number;
  offset: number;
}

export interface DsrResponse {
  items: DsrItem[];
  meta: DsrMeta;
}

export interface DsrPhoto {
  id: number;
  url: string;
}

export interface DsrMapPoint {
  lat: number;
  lng: number;
  date: string;
}

export interface LabourTrend {
  date: string;
  labour: number;
}

export interface ContractorAnalytics {
  contractor: string;
  entries: number;
}

export interface IssueAnalytics {
  total_reports: number;
  reports_with_issues: number;
}
