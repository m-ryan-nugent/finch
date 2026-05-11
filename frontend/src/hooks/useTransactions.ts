import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { transactionsApi } from '../api/transactions';
import type { TransactionCreate, TransactionFilter, TransactionUpdate } from '../types/transaction';
import { queryKeys } from './queryKeys';

export function useTransactions(filters: TransactionFilter = {}, limit = 50, offset = 0) {
  return useQuery({
    queryKey: queryKeys.transactions.list(filters, limit, offset),
    queryFn: () => transactionsApi.list(filters, limit, offset),
    placeholderData: keepPreviousData,
  });
}

function useInvalidateTransactionRelated() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.transactions.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.accounts.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.budgets.all });
  };
}

export function useCreateTransaction() {
  const invalidate = useInvalidateTransactionRelated();
  return useMutation({
    mutationFn: (data: TransactionCreate) => transactionsApi.create(data),
    onSuccess: invalidate,
  });
}

export function useUpdateTransaction() {
  const invalidate = useInvalidateTransactionRelated();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TransactionUpdate }) =>
      transactionsApi.update(id, data),
    onSuccess: invalidate,
  });
}

export function useDeleteTransaction() {
  const invalidate = useInvalidateTransactionRelated();
  return useMutation({
    mutationFn: (id: number) => transactionsApi.delete(id),
    onSuccess: invalidate,
  });
}
