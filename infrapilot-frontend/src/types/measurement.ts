export interface Measurement {
  id: number;
  project_id: number;
  final_area: number;
  approved_rate: number;
  extra_area: number;
  extra_rate: number;
  total_amount?: number; // Calculated on backend or frontend
  created_at?: string;
  updated_at?: string;
}

export interface MeasurementCreateData {
  project_id: number;
  final_area: number;
  approved_rate: number;
  extra_area: number;
  extra_rate: number;
}

export interface MeasurementUpdateData {
  final_area?: number;
  approved_rate?: number;
  extra_area?: number;
  extra_rate?: number;
}
