export type AccountType = "Asset" | "Liability" | "Equity" | "Income" | "Expense";

export interface ChartAccount {
  id: string;
  account_name: string;
  account_code: string;
  account_type: AccountType;
  parent_account_id?: string;
  opening_balance: number;
  current_balance: number;
  description?: string;
  is_active: boolean;
  children?: ChartAccount[];
}
