import type { Account } from './account';
import type { BudgetWithActual } from './budget';
import type { RecurringItem } from './recurring';
import type { Transaction, TransactionSummary } from './transaction';

export interface DashboardResponse {
  net_worth: string;
  total_assets: string;
  total_liabilities: string;
  accounts: Account[];
  month_summary: TransactionSummary;
  budget_vs_actual: BudgetWithActual[];
  recent_transactions: Transaction[];
  upcoming_recurring: RecurringItem[];
}
