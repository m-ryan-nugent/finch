import type { TransactionType } from './enums';

export interface Transaction {
  id: number;
  date: string;
  amount: string;
  type: TransactionType;
  account_id: number;
  category_id: number;
  description: string | null;
  notes: string | null;
  is_pending: boolean;
  transfer_to_account_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface TransactionCreate {
  date: string;
  amount: string;
  type: TransactionType;
  account_id: number;
  category_id: number;
  description?: string | null;
  notes?: string | null;
  is_pending?: boolean;
  transfer_to_account_id?: number | null;
}

export interface TransactionUpdate {
  date?: string;
  amount?: string;
  type?: TransactionType;
  account_id?: number;
  category_id?: number;
  description?: string | null;
  notes?: string | null;
  is_pending?: boolean;
  transfer_to_account_id?: number | null;
}

export interface TransactionFilter {
  account_id?: number;
  category_id?: number;
  type?: TransactionType;
  date_from?: string;
  date_to?: string;
  is_pending?: boolean;
}

export interface TransactionSummary {
  month: number;
  year: number;
  total_income: string;
  total_expenses: string;
  net: string;
}
