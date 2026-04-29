export interface Supplier {
  id: number;
  name: string;
  contact: string;
}

export interface SupplierCreate {
  name: string;
  contact: string;
}

export interface Material {
  id: number;
  material_code: string;
  project_id: number;
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  supplier_name: string;
  purchase_rate: number;
  rate_type: string;
  quantity_purchased: number;
  quantity_used: number;
  remaining_stock: number;
  total_amount: number;
  payment_given: number;
  payment_pending: number;
  extra_paid: number;
  minimum_stock_level: number;
  alert_type: "IN_STOCK" | "LOW_STOCK" | "NEAR_LOW";
}

export interface MaterialCreate {
  project_id: number;
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  purchase_rate: number;
  rate_type: string;
  quantity_purchased: number;
  payment_given: number;
  minimum_stock_level: number;
}

export interface MaterialUpdate {
  material_name?: string;
  category?: string;
  unit?: string;
  supplier_id?: number;
  purchase_rate?: number;
  rate_type?: string;
  minimum_stock_level?: number;
}

export interface PurchaseOrder {
  id: number;
  material_id: number;
  supplier_id: number;
  project_id: number;
  material_name: string;
  quantity: number;
  rate: number;
  total_amount: number;
  status: "CREATED" | "PENDING" | "COMPLETED" | "CANCELLED";
}

export interface POCreate {
  supplier_id: number;
  project_id: number;
  material_id: number;
  quantity: number;
  rate: number;
}

export interface Transfer {
  id: number;
  material: {
    id: number;
    name: string;
  };
  from_project: {
    id: number;
    name: string;
  };
  to_project: {
    id: number;
    name: string;
  };
  quantity: number;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  created_at: string;
}

export interface TransferCreate {
  material_id: number;
  from_project_id: number;
  to_project_id: number;
  quantity: number;
}

export interface InventoryLog {
  id: number;
  material_id: number;
  type: string;
  quantity: number;
  rate: number;
  avg_rate: number;
  total_amount: number;
  amount_paid: number;
  payment_pending: number;
  issue_type: string;
  project_id: number;
  created_at: string;
}

export interface MaterialReport {
  material_id: number;
  material_name: string;
  total_purchased: number;
  total_used: number;
  remaining_stock: number;
  total_cost: number;
  payment_pending: number;
}

export interface PriceHistory {
  rate: number;
  date: string;
}

export interface InventorySummary {
  total_materials: number;
  total_stock_value: number;
  total_pending_payments: number;
}
