export interface Expense {
  id: number;
  project_id: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_mode: string;
  boq_item_id?: number;
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
}

export interface ExpenseUpdateData {
  project_id?: number;
  category?: string;
  description?: string;
  amount?: number;
  expense_date?: string;
  payment_mode?: string;
  boq_item_id?: number;
}

export interface ExpenseSummary {
  project_id: number;
  total_expense: number;
}

export interface ExpenseBoqComparison {
  project_id: number;
  actual_expense: number;
}
