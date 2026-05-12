import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useTransactions,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from '../hooks/useTransactions';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import type { Transaction, TransactionCreate, TransactionFilter } from '../types/transaction';
import type { TransactionType } from '../types/enums';
import { TRANSACTION_TYPE_OPTIONS } from '../types/enums';
import { formatCurrency, formatDate } from '../utils/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

const LIMIT = 50;

export default function Transactions() {
  const toast = useToast();
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [offset, setOffset] = useState(0);
  const { data: transactions, isLoading } = useTransactions(filters, LIMIT, offset);
  const { data: accountData } = useAccounts();
  const { data: categories } = useCategories();

  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();
  const deleteMutation = useDeleteTransaction();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);

  const accountMap = useMemo(
    () => new Map(accountData?.accounts.map((a) => [a.id, a.name]) ?? []),
    [accountData],
  );
  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c.name]) ?? []),
    [categories],
  );

  const handleConfirmPending = async (txn: Transaction) => {
    try {
      await updateMutation.mutateAsync({ id: txn.id, data: { is_pending: false } });
      toast.success('Transaction confirmed');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to confirm');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Transaction deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const clearFilters = () => {
    setFilters({});
    setOffset(0);
  };

  const hasMore = (transactions?.length ?? 0) === LIMIT;

  return (
    <div>
      <PageHeader
        title="Transactions"
        action={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Transaction
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 [&>*]:min-w-0">
          <Select
            value={filters.account_id ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, account_id: e.target.value ? Number(e.target.value) : undefined }));
              setOffset(0);
            }}
            options={accountData?.accounts.map((a) => ({ value: a.id, label: a.name })) ?? []}
            placeholder="All Accounts"
          />
          <Select
            value={filters.category_id ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, category_id: e.target.value ? Number(e.target.value) : undefined }));
              setOffset(0);
            }}
            options={categories?.map((c) => ({ value: c.id, label: c.name })) ?? []}
            placeholder="All Categories"
          />
          <Select
            value={filters.type ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, type: (e.target.value || undefined) as TransactionType | undefined }));
              setOffset(0);
            }}
            options={TRANSACTION_TYPE_OPTIONS}
            placeholder="All Types"
          />
          <input
            type="date"
            aria-label="From date"
            value={filters.date_from ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_from: e.target.value || undefined }));
              setOffset(0);
            }}
            className="block h-10 min-w-0 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            placeholder="From"
          />
          <input
            type="date"
            aria-label="To date"
            value={filters.date_to ?? ''}
            onChange={(e) => {
              setFilters((f) => ({ ...f, date_to: e.target.value || undefined }));
              setOffset(0);
            }}
            className="block h-10 min-w-0 w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
          <div className="flex min-w-0 items-center">
            <Select
              value={filters.is_pending == null ? '' : String(filters.is_pending)}
              onChange={(e) => {
                const val = e.target.value;
                setFilters((f) => ({
                  ...f,
                  is_pending: val === '' ? undefined : val === 'true',
                }));
                setOffset(0);
              }}
              options={[
                { value: 'true', label: 'Pending' },
                { value: 'false', label: 'Confirmed' },
              ]}
              placeholder="All Status"
            />
          </div>
        </div>
        {Object.values(filters).some((v) => v != null) && (
          <div className="mt-3">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          title="No transactions found"
          description={
            Object.values(filters).some((v) => v != null)
              ? 'Try adjusting your filters.'
              : 'Add your first transaction to get started.'
          }
        />
      ) : (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Account
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className={txn.is_pending ? 'bg-yellow-50/50' : ''}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(txn.date)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className={txn.is_pending ? 'text-gray-400' : 'text-gray-900'}>
                          {txn.description || '(no description)'}
                        </span>
                        {txn.is_pending && <Badge variant="warning">Pending</Badge>}
                        <Badge
                          variant={
                            txn.type === 'income'
                              ? 'success'
                              : txn.type === 'expense'
                                ? 'danger'
                                : 'info'
                          }
                        >
                          {txn.type}
                        </Badge>
                      </div>
                      {txn.type === 'transfer' && txn.transfer_to_account_id && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {accountMap.get(txn.account_id) ?? ''} →{' '}
                          {accountMap.get(txn.transfer_to_account_id) ?? ''}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {categoryMap.get(txn.category_id) ?? ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {accountMap.get(txn.account_id) ?? ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                      <span
                        className={`font-medium ${
                          txn.type === 'income'
                            ? 'text-green-600'
                            : txn.type === 'expense'
                              ? 'text-red-600'
                              : 'text-blue-600'
                        }`}
                      >
                        {txn.type === 'income' ? '+' : txn.type === 'expense' ? '-' : ''}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {txn.is_pending && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConfirmPending(txn)}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditing(txn); setModalOpen(true); }}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleting(txn)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500">
              Showing {offset + 1}–{offset + transactions.length}
            </p>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasMore}
                onClick={() => setOffset(offset + LIMIT)}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editing}
        accounts={accountData?.accounts ?? []}
        categories={categories ?? []}
        onSubmit={async (formData) => {
          try {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, data: formData });
              toast.success('Transaction updated');
            } else {
              await createMutation.mutateAsync(formData as TransactionCreate);
              toast.success('Transaction created');
            }
            setModalOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to save');
          }
        }}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Transaction"
        message="Are you sure you want to delete this transaction? Account balances will be adjusted."
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function TransactionModal({
  isOpen,
  onClose,
  transaction,
  accounts,
  categories,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  onSubmit: (data: TransactionCreate) => void;
  isLoading: boolean;
}) {
  const today = new Date().toISOString().split('T')[0]!;
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<TransactionCreate>();

  useEffect(() => {
    if (isOpen) {
      reset(
        transaction
          ? {
              date: transaction.date,
              amount: transaction.amount,
              type: transaction.type,
              account_id: transaction.account_id,
              category_id: transaction.category_id,
              description: transaction.description ?? '',
              notes: transaction.notes ?? '',
              is_pending: transaction.is_pending,
              transfer_to_account_id: transaction.transfer_to_account_id ?? undefined,
            }
          : {
              date: today,
              amount: '',
              type: 'expense',
              is_pending: false,
              description: '',
              notes: '',
            },
      );
    }
  }, [isOpen, transaction, reset, today]);

  const txnType = watch('type');
  const selectedAccountId = watch('account_id');

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={transaction ? 'Edit Transaction' : 'Add Transaction'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <FormField label="Date" error={errors.date?.message}>
            <input
              type="date"
              {...register('date', { required: 'Date is required' })}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </FormField>

          <FormField label="Amount" error={errors.amount?.message}>
            <input
              {...register('amount', {
                required: 'Amount is required',
                pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
                validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0',
              })}
              placeholder="0.00"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </FormField>

          <FormField label="Type" error={errors.type?.message}>
            <Select
              {...register('type', { required: 'Type is required' })}
              options={TRANSACTION_TYPE_OPTIONS}
            />
          </FormField>

          <FormField label="Account" error={errors.account_id?.message}>
            <Select
              {...register('account_id', {
                required: 'Account is required',
                valueAsNumber: true,
              })}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="Select account"
            />
          </FormField>

          {txnType === 'transfer' && (
            <FormField label="Transfer To" error={errors.transfer_to_account_id?.message}>
              <Select
                {...register('transfer_to_account_id', {
                  required: 'Destination is required',
                  valueAsNumber: true,
                  validate: (v) =>
                    !v || v !== Number(selectedAccountId) || 'Cannot transfer to same account',
                })}
                options={accounts
                  .filter((a) => a.id !== Number(selectedAccountId))
                  .map((a) => ({ value: a.id, label: a.name }))}
                placeholder="Select destination"
              />
            </FormField>
          )}

          <FormField label="Category" error={errors.category_id?.message}>
            <Select
              {...register('category_id', {
                required: 'Category is required',
                valueAsNumber: true,
              })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
          </FormField>
        </div>

        <FormField label="Description">
          <input
            {...register('description', {
              maxLength: { value: 200, message: 'Max 200 characters' },
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            placeholder="What was this for?"
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            {...register('notes')}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="is_pending"
            {...register('is_pending')}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="is_pending" className="text-sm text-gray-700">
            Mark as pending
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {transaction ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
