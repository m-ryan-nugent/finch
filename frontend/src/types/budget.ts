export interface Budget {
  id: number;
  category_id: number;
  month: number;
  year: number;
  amount: string;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithActual extends Budget {
  actual_spent: string;
  remaining: string;
}

export interface BudgetCreate {
  category_id: number;
  month: number;
  year: number;
  amount: string;
}

export interface BudgetUpdate {
  amount?: string;
}
