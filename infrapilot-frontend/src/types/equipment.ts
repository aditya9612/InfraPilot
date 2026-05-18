export type EquipmentCondition = "GOOD" | "FAIR" | "POOR" | "REPAIR" | "SERVICE" | "DAMAGED" | "MAINTENANCE";

export interface EquipmentItem {
  id: number;
  project_id: number;
  equipment_name: string;
  equipment_code: string;
  operator_name: string;
  working_hours: number;
  fuel_used: number;
  condition: EquipmentCondition | string;
  rental_cost: number;
  maintenance_date: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateEquipmentRequest {
  project_id: number;
  equipment_name: string;
  equipment_code: string;
  operator_name: string;
  working_hours: number;
  fuel_used: number;
  condition: EquipmentCondition | string;
  rental_cost: number;
  maintenance_date: string;
}

export interface UpdateEquipmentRequest {
  project_id?: number;
  equipment_name?: string;
  equipment_code?: string;
  operator_name?: string;
  working_hours?: number;
  fuel_used?: number;
  condition?: EquipmentCondition | string;
  rental_cost?: number;
  maintenance_date?: string;
}

export interface EquipmentResponse {
  items: EquipmentItem[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}