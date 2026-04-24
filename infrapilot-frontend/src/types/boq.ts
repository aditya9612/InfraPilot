export interface BoqItem {
  id: number;
  project_id: number;
  boq_group_id?: number;
  version_no?: number;
  is_latest?: boolean;
  item_name: string;
  category: string;
  description: string;
  quantity: number | string;
  unit: string;
  unit_cost: number | string;
  total_cost?: number | string;
  actual_quantity?: number | string;
  actual_cost?: number | string;
  variance_cost?: number | string;
  is_completed?: boolean;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export interface BoqSummary {
  total_items: number;
  estimated: number;
  actual: number;
  difference: number;
}

export interface BoqComparisonItem {
  item_name: string;
  estimated: number;
  actual: number;
  variance: number;
}

export interface BoqOptimizationSuggestion {
  item: string;
  suggestion: string;
  over_budget_by: number;
}

export interface BoqLog {
  action: string;
  message: string;
  user_id: number;
  timestamp: string;
  changes: Record<string, { new: any; old: any }> | null;
}

export interface BoqVersionList {
  versions: number[];
}

export interface CreateBoqRequest {
  project_id: number;
  item_name: string;
  category: string;
  description: string;
  quantity: number;
  unit: string;
  unit_cost: number;
  status: string;
}

export interface UpdateBoqRequest {
  item_name?: string;
  category?: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unit_cost?: number;
  status?: string;
  is_completed?: boolean;
}

export interface UpdateActualsRequest {
  actual_quantity: number;
  actual_cost: number;
}

export interface BoqFilters {
  limit?: number;
  offset?: number;
  search?: string | null;
  status?: string | null;
  project_id?: number | null;
  category?: string | null;
  version_no?: number | null;
}

export interface BoqResponse {
  items: BoqItem[];
  total: number;
  limit: number;
  offset: number;
}
