import api from './client';
import type { RecurringItem, RecurringItemCreate, RecurringItemUpdate } from '../types/recurring';
import type { Transaction } from '../types/transaction';

export const recurringApi = {
  list: () =>
    api.get<RecurringItem[]>('/recurring-items/').then((r) => r.data),

  get: (id: number) =>
    api.get<RecurringItem>(`/recurring-items/${id}`).then((r) => r.data),

  create: (data: RecurringItemCreate) =>
    api.post<RecurringItem>('/recurring-items/', data).then((r) => r.data),

  update: (id: number, data: RecurringItemUpdate) =>
    api.patch<RecurringItem>(`/recurring-items/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/recurring-items/${id}`),

  generateDue: () =>
    api.post<Transaction[]>('/recurring-items/generate-due').then((r) => r.data),

  generateSingle: (id: number) =>
    api.post<Transaction>(`/recurring-items/${id}/generate`).then((r) => r.data),
};
