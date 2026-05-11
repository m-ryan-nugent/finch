import type { TransactionFilter } from '../types/transaction';

export const queryKeys = {
  accounts: {
    all: ['accounts'] as const,
    detail: (id: number) => ['accounts', id] as const,
  },
  transactions: {
    all: ['transactions'] as const,
    list: (filters: TransactionFilter, limit: number, offset: number) =>
      ['transactions', 'list', filters, limit, offset] as const,
    summary: (month: number, year: number) =>
      ['transactions', 'summary', month, year] as const,
  },
  categories: {
    all: ['categories'] as const,
  },
  budgets: {
    all: ['budgets'] as const,
    list: (month: number, year: number) => ['budgets', month, year] as const,
  },
  recurring: {
    all: ['recurring'] as const,
  },
  dashboard: {
    all: ['dashboard'] as const,
  },
};
