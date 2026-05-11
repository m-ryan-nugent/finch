export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment' | 'loan';
export type TransactionType = 'income' | 'expense' | 'transfer';
export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annually';

export const ASSET_TYPES: AccountType[] = ['checking', 'savings', 'investment'];
export const LIABILITY_TYPES: AccountType[] = ['credit_card', 'loan'];

export const ACCOUNT_TYPE_OPTIONS: { value: AccountType; label: string }[] = [
  { value: 'checking', label: 'Checking' },
  { value: 'savings', label: 'Savings' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'investment', label: 'Investment' },
  { value: 'loan', label: 'Loan' },
];

export const TRANSACTION_TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

export const FREQUENCY_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annually', label: 'Annually' },
];
