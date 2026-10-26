export interface Expense {
  id: number;
  project_id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_mode: string;
  boq_item_id?: number;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  upi_id?: string;
  cheque_number?: string;
  cheque_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseCreateData {
  project_id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_mode: string;
  boq_item_id?: number;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  upi_id?: string;
  cheque_number?: string;
  cheque_date?: string;
}

export interface ExpenseUpdateData {
  project_id?: number;
  category?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  payment_mode?: string;
  boq_item_id?: number;
  account_holder_name?: string;
  account_number?: string;
  ifsc_code?: string;
  bank_name?: string;
  upi_id?: string;
  cheque_number?: string;
  cheque_date?: string;
}

export interface ExpenseSummary {
  project_id: number;
  total_expense: number;
}

export interface ExpenseBoqComparison {
  project_id: number;
  actual_expense: number;
}
