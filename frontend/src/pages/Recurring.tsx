import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useRecurring,
  useCreateRecurring,
  useUpdateRecurring,
  useDeleteRecurring,
  useGenerateDue,
  useGenerateSingle,
} from '../hooks/useRecurring';
import { useAccounts } from '../hooks/useAccounts';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import type { RecurringItem, RecurringItemCreate } from '../types/recurring';
import { FREQUENCY_OPTIONS } from '../types/enums';
import { formatCurrency, formatDate, formatFrequency, isOverdue } from '../utils/format';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Recurring() {
  const toast = useToast();
  const { data: items, isLoading } = useRecurring();
  const { data: accountData } = useAccounts();
  const { data: categories } = useCategories();
  const createMutation = useCreateRecurring();
  const updateMutation = useUpdateRecurring();
  const deleteMutation = useDeleteRecurring();
  const generateDueMutation = useGenerateDue();
  const generateSingleMutation = useGenerateSingle();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringItem | null>(null);
  const [deleting, setDeleting] = useState<RecurringItem | null>(null);

  const accountMap = useMemo(
    () => new Map(accountData?.accounts.map((a) => [a.id, a.name]) ?? []),
    [accountData],
  );
  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c.name]) ?? []),
    [categories],
  );

  const handleGenerateAll = async () => {
    try {
      const result = await generateDueMutation.mutateAsync();
      if (result.length === 0) {
        toast.success('No items are due');
      } else {
        toast.success(`Generated ${result.length} pending transaction${result.length > 1 ? 's' : ''}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate');
    }
  };

  const handleGenerateSingle = async (id: number) => {
    try {
      await generateSingleMutation.mutateAsync(id);
      toast.success('Pending transaction created');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to generate');
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Recurring item deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <PageHeader
        title="Recurring Items"
        action={
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="secondary"
              onClick={handleGenerateAll}
              isLoading={generateDueMutation.isPending}
            >
              Generate All Due
            </Button>
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              Add Item
            </Button>
          </div>
        }
      />

      {!items || items.length === 0 ? (
        <EmptyState
          title="No recurring items"
          description="Add recurring bills or income to track them automatically."
          action={
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              Add Item
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => {
            const overdue = item.is_active && isOverdue(item.next_due_date);
            return (
              <Card
                key={item.id}
                className={!item.is_active ? 'opacity-60' : ''}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant={item.type === 'income' ? 'success' : 'danger'}>
                        {item.type}
                      </Badge>
                      <Badge variant="neutral">{formatFrequency(item.frequency)}</Badge>
                      {!item.is_active && <Badge variant="neutral">Inactive</Badge>}
                    </div>
                  </div>
                  <p
                    className={`text-lg font-semibold ${
                      item.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(item.amount)}
                  </p>
                </div>

                <div className="mt-3 text-sm text-gray-500 space-y-1">
                  <p>
                    Next due:{' '}
                    <span className={overdue ? 'text-red-600 font-medium' : ''}>
                      {formatDate(item.next_due_date)}
                    </span>
                    {overdue && <Badge variant="danger">Overdue</Badge>}
                  </p>
                  <p>Account: {accountMap.get(item.account_id) ?? ''}</p>
                  <p>Category: {categoryMap.get(item.category_id) ?? ''}</p>
                </div>

                <div className="flex gap-2 mt-4">
                  {item.is_active && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleGenerateSingle(item.id)}
                      isLoading={generateSingleMutation.isPending}
                    >
                      Generate
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setEditing(item); setModalOpen(true); }}
                  >
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(item)}>
                    Delete
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <RecurringModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        item={editing}
        accounts={accountData?.accounts ?? []}
        categories={categories ?? []}
        onSubmit={async (formData) => {
          try {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, data: formData });
              toast.success('Recurring item updated');
            } else {
              await createMutation.mutateAsync(formData as RecurringItemCreate);
              toast.success('Recurring item created');
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
        title="Delete Recurring Item"
        message={`Are you sure you want to delete "${deleting?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function RecurringModal({
  isOpen,
  onClose,
  item,
  accounts,
  categories,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  item: RecurringItem | null;
  accounts: { id: number; name: string }[];
  categories: { id: number; name: string }[];
  onSubmit: (data: RecurringItemCreate) => void;
  isLoading: boolean;
}) {
  const today = new Date().toISOString().split('T')[0]!;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<RecurringItemCreate>();

  useEffect(() => {
    if (isOpen) {
      reset(
        item
          ? {
              name: item.name,
              amount: item.amount,
              frequency: item.frequency,
              next_due_date: item.next_due_date,
              account_id: item.account_id,
              category_id: item.category_id,
              type: item.type,
              is_active: item.is_active,
              notes: item.notes ?? '',
            }
          : {
              name: '',
              amount: '',
              frequency: 'monthly',
              next_due_date: today,
              type: 'expense',
              is_active: true,
              notes: '',
            },
      );
    }
  }, [isOpen, item, reset, today]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={item ? 'Edit Recurring Item' : 'Add Recurring Item'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-4">
          <FormField label="Name" error={errors.name?.message}>
            <input
              {...register('name', {
                required: 'Name is required',
                maxLength: { value: 100, message: 'Max 100 characters' },
              })}
              className="block h-10 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </FormField>

          <FormField label="Amount" error={errors.amount?.message}>
            <input
              {...register('amount', {
                required: 'Required',
                pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
                validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0',
              })}
              placeholder="0.00"
              className="block h-10 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </FormField>

          <FormField label="Frequency" error={errors.frequency?.message}>
            <Select
              {...register('frequency', { required: 'Required' })}
              options={FREQUENCY_OPTIONS}
            />
          </FormField>

          <FormField label="Next Due Date" error={errors.next_due_date?.message}>
            <input
              type="date"
              {...register('next_due_date', { required: 'Required' })}
              className="block h-10 w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </FormField>

          <FormField label="Type" error={errors.type?.message}>
            <Select
              {...register('type', { required: 'Required' })}
              options={[
                { value: 'income', label: 'Income' },
                { value: 'expense', label: 'Expense' },
              ]}
            />
          </FormField>

          <FormField label="Account" error={errors.account_id?.message}>
            <Select
              {...register('account_id', { required: 'Required', valueAsNumber: true })}
              options={accounts.map((a) => ({ value: a.id, label: a.name }))}
              placeholder="Select account"
            />
          </FormField>

          <FormField label="Category" error={errors.category_id?.message}>
            <Select
              {...register('category_id', { required: 'Required', valueAsNumber: true })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Select category"
            />
          </FormField>
        </div>

        <FormField label="Notes">
          <textarea
            {...register('notes')}
            rows={2}
            className="block w-full min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            id="is_active"
            {...register('is_active')}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {item ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
