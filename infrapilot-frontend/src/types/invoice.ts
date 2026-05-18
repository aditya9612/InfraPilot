export type InvoiceType = "owner" | "labour" | "material" | "expense";
export type InvoiceStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface Invoice {
  id: number;
  project_id: number;
  owner_id: number;
  type: InvoiceType;
  reference_id: number;
  amount: number;
  gst_percent: number;
  gst_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  description: string;
  created_at: string;
  invoice_date?: string;
  invoice_number?: string;
  client_name?: string;
  due_date?: string;
  quantity?: number;
  rate?: number;
}

export interface InvoiceCreateData {
  project_id: number;
  owner_id: number;
  type: InvoiceType;
  reference_id: number;
  amount: number;
  gst_percent: number;
  gst_amount: number;
  tax_percent: number;
  tax_amount: number;
  total_amount: number;
  description: string;
}
