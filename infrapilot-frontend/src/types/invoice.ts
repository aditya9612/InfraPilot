export type InvoiceType = "labour" | "material" | "owner" | "other";
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: number;
  project_id: number;
  owner_id: number;
  type: InvoiceType;
  reference_id: number;
  amount: number; // base amount
  gst_percent: number;
  gst_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  description: string;
  created_at: string;
}

export interface InvoiceCreateData {
  project_id: number;
  owner_id: number;
  type: InvoiceType;
  reference_id: number;
  amount: number;
  gst_percent: number;
  tax_percent: number;
  description: string;
}
