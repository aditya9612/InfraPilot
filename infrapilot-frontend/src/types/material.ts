export type RateType = 'FIXED' | 'PER_UNIT' | 'PER_KG' | 'PER_TON' | 'PER_BAG';
export type AlertType = 'LOW_STOCK' | 'IN_STOCK' | 'NEAR_LOW' | 'OUT_OF_STOCK';
export type IssueType = 'SITE' | 'SYSTEM' | 'STORE' | 'MANUAL' | 'DAMAGE' | 'LOSS' | 'VENDOR' | 'TRANSFER' | 'ADJUSTMENT' | 'PURCHASE';
export type POType = 'COMMON' | 'SITE_WISE';
export type POStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_RECEIVED'
  | 'FULLY_RECEIVED'
  | 'CLOSED'
  | 'CANCELLED'
  | 'CREATED'
  | 'PENDING'
  | 'COMPLETED';
export type ValuationMethod = 'WAC' | 'FIFO' | 'LPR';

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
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
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
  material_master_id?: number;
  material_code?: string;
  material_name?: string;
  category?: string;
  unit?: string;
  description?: string;
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
  description?: string;
  status?: 'ACTIVE' | 'INACTIVE';
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
  task_id?: number | null;
  issue_type?: IssueType;
  boq_item_id?: number | null;
}

export interface PurchasePayload {
  quantity: number;
  rate: number;
  amount_paid: number;
  project_id: number;
  task_id?: number;
  boq_item_id?: number;
  issue_type: IssueType;
}

export interface POLineItem {
  id?: number;
  material_id: number;
  material_name: string;
  material_code?: string;
  unit?: string;
  boq_item_id?: number;
  boq_item_name?: string;
  ordered_qty: number;
  received_qty: number;
  pending_balance_qty: number;
  rate: number;
  tax_percent?: number;
  discount_percent?: number;
  line_total: number;
}

export interface PurchaseOrder {
  id: number;
  po_number?: string;
  po_type?: POType;
  material_id: number;
  supplier_id: number;
  supplier_name?: string;
  project_id: number | null;
  project_name?: string;
  boq_item_id?: number;
  material_name: string;
  quantity: number;
  rate: number;
  subtotal?: number;
  tax_total?: number;
  discount_total?: number;
  total_amount: number;
  delivery_date?: string;
  payment_terms?: string;
  notes?: string;
  attachment_url?: string;
  items?: POLineItem[];
  status: POStatus;
  cancellation_status?: 'NONE' | 'PENDING_ADMIN_OTP' | 'CANCELLED';
  created_by?: string;
  approved_by?: string;
  created_at?: string;
}

export interface POCreate {
  po_type?: POType;
  supplier_id: number;
  project_id: number | null;
  material_id: number;
  boq_item_id?: number;
  quantity: number;
  rate: number;
  delivery_date?: string;
  payment_terms?: string;
  notes?: string;
  status?: POStatus;
  items?: Omit<POLineItem, 'id' | 'received_qty' | 'pending_balance_qty'>[];
}

export interface InwardReceiptItem {
  material_id: number;
  material_name: string;
  material_code?: string;
  unit?: string;
  ordered_qty?: number;
  pending_qty?: number;
  received_qty: number;
  rate: number;
  total: number;
}

export interface InwardReceipt {
  id: number;
  receipt_no: string;
  po_id?: number | null;
  po_number?: string;
  po_type?: POType;
  supplier_id: number;
  supplier_name?: string;
  receiving_project_id: number;
  receiving_project_name?: string;
  challan_no: string;
  delivery_date: string;
  vehicle_no?: string;
  transporter?: string;
  driver_contact?: string;
  inspection_status: 'PENDING' | 'PASSED' | 'PARTIAL' | 'REJECTED';
  is_direct_inward?: boolean;
  justification?: string;
  attachment_name?: string;
  items: InwardReceiptItem[];
  total_amount: number;
  status: 'POSTED' | 'PENDING_ADMIN_OTP' | 'CANCELLED';
  created_by?: string;
  created_at: string;
}

export interface CreateInwardPayload {
  po_id?: number | null;
  supplier_id: number;
  receiving_project_id: number;
  challan_no: string;
  delivery_date: string;
  vehicle_no?: string;
  transporter?: string;
  driver_contact?: string;
  inspection_status: 'PENDING' | 'PASSED' | 'PARTIAL' | 'REJECTED';
  is_direct_inward?: boolean;
  justification?: string;
  allow_over_delivery?: boolean;
  attachment_name?: string;
  items: InwardReceiptItem[];
}

export interface OutwardIssueItem {
  material_id: number;
  material_name: string;
  material_code?: string;
  unit?: string;
  available_stock?: number;
  issue_qty: number;
  rate?: number;
}

export interface OutwardIssue {
  id: number;
  issue_slip_no: string;
  project_id: number;
  project_name?: string;
  issue_date: string;
  issued_to: string;
  purpose: string;
  work_location?: string;
  remarks?: string;
  items: OutwardIssueItem[];
  total_value: number;
  status: 'POSTED' | 'PENDING_ADMIN_OTP' | 'CANCELLED';
  created_by?: string;
  created_at: string;
}

export interface CreateOutwardPayload {
  project_id: number;
  issue_date: string;
  issued_to: string;
  purpose: string;
  work_location?: string;
  issue_slip_no?: string;
  remarks?: string;
  items: OutwardIssueItem[];
}

export interface DailyStockRecord {
  id: number;
  date: string;
  project_id: number;
  project_name?: string;
  material_id: number;
  material_name: string;
  material_code?: string;
  unit?: string;
  opening_stock: number;
  inward_qty: number;
  outward_qty: number;
  adjustment_qty?: number;
  closing_stock: number;
  rate: number;
  closing_value: number;
  entry_source: 'AUTO_TX' | 'MANUAL' | 'BULK_UPLOAD' | 'ADJUSTMENT';
  notes?: string;
  created_by?: string;
  created_at?: string;
}

export interface StockLedgerEntry {
  id: number;
  created_at: string;
  project_id: number;
  project_name?: string;
  material_id: number;
  material_name: string;
  material_code?: string;
  unit?: string;
  tx_type: 'INWARD' | 'OUTWARD' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'REVERSAL';
  ref_no: string;
  in_qty: number;
  out_qty: number;
  running_balance: number;
  rate?: number;
  value?: number;
  user_name?: string;
  notes?: string;
  is_reversal?: boolean;
}

export interface OTPCancellationRequest {
  id: number;
  entity_type: 'PO' | 'INWARD' | 'OUTWARD';
  entity_id: number;
  entity_ref: string;
  project_id?: number;
  requested_by: string;
  requested_at: string;
  reason: string;
  status: 'PENDING_OTP' | 'APPROVED' | 'REJECTED';
  otp_hint?: string;
  approved_by?: string;
  approved_at?: string;
  reversal_id?: string;
}

export interface BulkMaterialRow {
  row_number: number;
  material_code: string;
  material_name: string;
  category: string;
  unit: string;
  description?: string;
  minimum_stock_level?: number;
  purchase_rate?: number;
  status: 'VALID' | 'DUPLICATE' | 'ERROR';
  error_reason?: string;
  conflict_action?: 'SKIP' | 'OVERWRITE';
}

export interface MaterialThresholdConfig {
  material_id: number;
  project_id: number;
  minimum_stock_level: number;
  updated_at?: string;
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
  boq_item_id?: number | null;
  task_id?: number | null;
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
  alert_type?: string;
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
