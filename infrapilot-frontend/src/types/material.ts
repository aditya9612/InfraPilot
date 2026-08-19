export type RateType = 'FIXED' | 'VARIABLE';
export type AlertType = 'LOW_STOCK' | 'IN_STOCK' | 'NEAR_LOW' | 'OUT_OF_STOCK';
export type IssueType = 'SITE' | 'SYSTEM' | 'STORE' | 'MANUAL' | 'DAMAGE' | 'LOSS' | 'VENDOR' | 'TRANSFER' | 'ADJUSTMENT' | 'PURCHASE';

export interface Supplier {
  id: number;
  name: string;
  contact: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gst?: string;
  address?: string;
}

export interface SupplierCreate {
  name: string;
  contact: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  gst?: string;
  address?: string;
}

// Full material object — returned by ALL material APIs
export interface Material {
  id: number;
  material_code: string;          // MAT001 — auto by system
  project_id: number;
  material_name: string;
  material_master_id?: number;    // from API response
  material_master_name?: string;  // from API response
  material_master_brand?: string; // from API response
  category: string;
  unit: string;                   // Bags / Kg / Ton / Litre
  unit_name?: string;             // from API response
  supplier_id: number;
  supplier_name: string;          // auto-fetched from supplier
  purchase_rate: number;
  rate_type: RateType;
  quantity_purchased: number;     // cumulative total
  quantity_used: number;          // cumulative total
  remaining_stock: number;        // quantity_purchased - quantity_used
  total_amount: number;
  payment_given: number;
  payment_pending: number;        // total_amount - payment_given
  extra_paid: number;             // overpayment if any
  minimum_stock_level: number;
  alert_type: AlertType;          // system sets automatically

  // UI Compatibility aliases
  material_id: number;           // alias for id
  total_value: number;           // alias for total_amount
  avg_rate: number;              // alias for purchase_rate
}

export interface CreateMaterialPayload {
  project_id: number;
  material_name: string;
  category: string;
  unit: string;
  supplier_id: number;
  purchase_rate: number;
  rate_type: RateType;
  quantity_purchased: number;
  payment_given: number;
  minimum_stock_level: number;
}

export interface UpdateMaterialPayload {
  material_name?: string;
  category?: string;
  unit?: string;
  supplier_id?: number;
  purchase_rate?: number;
  rate_type?: RateType;
  minimum_stock_level?: number;
}

// Aliases for backward compatibility
export type MaterialCreate = CreateMaterialPayload;
export type MaterialUpdate = UpdateMaterialPayload;

export interface UsagePayload {
  quantity: number;
  project_id: number;
  task_id: number;
  issue_type: IssueType;
}

export interface PurchasePayload {
  quantity: number;
  rate: number;
  amount_paid: number;
  project_id: number;
  task_id?: number;
  issue_type: IssueType;
  boq_item_id?: number;
}

export interface PurchaseOrder {
  id: number;
  material_id: number;
  supplier_id: number;
  project_id: number;
  boq_item_id?: number;
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
  boq_item_id?: number;
  quantity: number;
  rate: number;
}

export type TransferStatus = "PENDING" | "COMPLETED" | "CANCELLED" | "IN_TRANSIT" | "DELIVERED";

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
  status: TransferStatus;
  created_at: string;
  remarks?: string;
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
  material_name?: string;
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
  project_id?: number;
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

// Aliases for the UI pages
export type MaterialItem = Material;
export type InventoryItem = Material;
export type MaterialLog = InventoryLog;
export type CreateMaterialRequest = CreateMaterialPayload;
