import api from './client';
import type { BudgetCreate, BudgetUpdate, BudgetWithActual } from '../types/budget';
import type { Budget } from '../types/budget';

export const budgetsApi = {
  list: (month: number, year: number) =>
    api
      .get<BudgetWithActual[]>('/budgets/', { params: { month, year } })
      .then((r) => r.data),

  get: (id: number) =>
    api.get<Budget>(`/budgets/${id}`).then((r) => r.data),

  create: (data: BudgetCreate) =>
    api.post<Budget>('/budgets/', data).then((r) => r.data),

  update: (id: number, data: BudgetUpdate) =>
    api.patch<Budget>(`/budgets/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/budgets/${id}`),
};
