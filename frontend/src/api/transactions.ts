import api from './client';
import type {
  Transaction,
  TransactionCreate,
  TransactionFilter,
  TransactionSummary,
  TransactionUpdate,
} from '../types/transaction';

export const transactionsApi = {
  list: (filters: TransactionFilter = {}, limit = 50, offset = 0) => {
    const params: Record<string, string | number | boolean> = { limit, offset };
    if (filters.account_id != null) params.account_id = filters.account_id;
    if (filters.category_id != null) params.category_id = filters.category_id;
    if (filters.type) params.type = filters.type;
    if (filters.date_from) params.date_from = filters.date_from;
    if (filters.date_to) params.date_to = filters.date_to;
    if (filters.is_pending != null) params.is_pending = filters.is_pending;
    return api.get<Transaction[]>('/transactions/', { params }).then((r) => r.data);
  },

  get: (id: number) =>
    api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),

  create: (data: TransactionCreate) =>
    api.post<Transaction>('/transactions/', data).then((r) => r.data),

  update: (id: number, data: TransactionUpdate) =>
    api.patch<Transaction>(`/transactions/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/transactions/${id}`),

  summary: (month: number, year: number) =>
    api
      .get<TransactionSummary>('/transactions/summary', { params: { month, year } })
      .then((r) => r.data),
};
