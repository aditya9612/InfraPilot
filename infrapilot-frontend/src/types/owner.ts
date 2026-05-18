export interface Owner {
  id: string;
  name: string;
  mobile: string;
  email: string;
  address: string;
  pan: string;
  owner_code?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OwnerPayment {
  id: number;
  owner_id: number;
  project_id: number;
  type: "credit" | "debit";
  amount: number;
  reference_type: string;
  reference_id: number;
  description: string;
}

export interface OwnerLedgerResponse {
  total_credit: number;
  total_debit: number;
  balance: number;
  transactions: OwnerPayment[];
}

export interface LedgerEntry {
  id: string;
  date: string;
  particulars: string;
  reference: string;
  type: "Credit" | "Debit" | "Payment";
  amount: number;
}
