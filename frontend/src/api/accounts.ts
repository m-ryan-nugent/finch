import api from './client';
import type { Account, AccountCreate, AccountListResponse, AccountUpdate } from '../types/account';

export const accountsApi = {
  list: () =>
    api.get<AccountListResponse>('/accounts/').then((r) => r.data),

  get: (id: number) =>
    api.get<Account>(`/accounts/${id}`).then((r) => r.data),

  create: (data: AccountCreate) =>
    api.post<Account>('/accounts/', data).then((r) => r.data),

  update: (id: number, data: AccountUpdate) =>
    api.patch<Account>(`/accounts/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/accounts/${id}`),
};
