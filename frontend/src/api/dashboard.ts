import api from './client';
import type { DashboardResponse } from '../types/dashboard';

export const dashboardApi = {
  get: () =>
    api.get<DashboardResponse>('/dashboard').then((r) => r.data),
};
