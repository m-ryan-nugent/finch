import type { AccountType } from './enums';

export interface Account {
  id: number;
  name: string;
  type: AccountType;
  balance: string;
  credit_limit: string | null;
  institution: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccountListResponse {
  accounts: Account[];
  total_assets: string;
  total_liabilities: string;
  net_worth: string;
}

export interface AccountCreate {
  name: string;
  type: AccountType;
  balance?: string;
  credit_limit?: string | null;
  institution?: string | null;
  notes?: string | null;
}

export interface AccountUpdate {
  name?: string;
  type?: AccountType;
  balance?: string;
  credit_limit?: string | null;
  institution?: string | null;
  notes?: string | null;
}
