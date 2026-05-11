import type { Frequency, TransactionType } from './enums';

export interface RecurringItem {
  id: number;
  name: string;
  amount: string;
  frequency: Frequency;
  next_due_date: string;
  account_id: number;
  category_id: number;
  type: TransactionType;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringItemCreate {
  name: string;
  amount: string;
  frequency: Frequency;
  next_due_date: string;
  account_id: number;
  category_id: number;
  type?: TransactionType;
  is_active?: boolean;
  notes?: string | null;
}

export interface RecurringItemUpdate {
  name?: string;
  amount?: string;
  frequency?: Frequency;
  next_due_date?: string;
  account_id?: number;
  category_id?: number;
  type?: TransactionType;
  is_active?: boolean;
  notes?: string | null;
}
