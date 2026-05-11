import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboard';
import { queryKeys } from './queryKeys';

export function useDashboard() {
  return useQuery({
    queryKey: queryKeys.dashboard.all,
    queryFn: dashboardApi.get,
    staleTime: 30 * 1000,
  });
}
