import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from '../hooks/useBudgets';
import { useCategories } from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import type { BudgetCreate, BudgetWithActual } from '../types/budget';
import { formatCurrency, currentMonth } from '../utils/format';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';
import MonthSelector from '../components/MonthSelector';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Budgets() {
  const toast = useToast();
  const cm = currentMonth();
  const [month, setMonth] = useState(cm.month);
  const [year, setYear] = useState(cm.year);

  const { data: budgets, isLoading } = useBudgets(month, year);
  const { data: categories } = useCategories();
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();
  const deleteMutation = useDeleteBudget();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithActual | null>(null);
  const [deleting, setDeleting] = useState<BudgetWithActual | null>(null);

  const categoryMap = useMemo(
    () => new Map(categories?.map((c) => [c.id, c.name]) ?? []),
    [categories],
  );

  const budgetedCategoryIds = useMemo(
    () => new Set(budgets?.map((b) => b.category_id) ?? []),
    [budgets],
  );

  const availableCategories = useMemo(
    () => categories?.filter((c) => !budgetedCategoryIds.has(c.id)) ?? [],
    [categories, budgetedCategoryIds],
  );

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Budget deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  return (
    <div>
      <PageHeader
        title="Budgets"
        action={
          <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <MonthSelector
              month={month}
              year={year}
              onChange={(m, y) => { setMonth(m); setYear(y); }}
            />
            <Button onClick={() => setAddOpen(true)} className="shrink-0">
              Add Budget
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <LoadingSpinner />
      ) : !budgets || budgets.length === 0 ? (
        <EmptyState
          title="No budgets for this month"
          description="Add a budget to start tracking spending by category."
          action={<Button onClick={() => setAddOpen(true)}>Add Budget</Button>}
        />
      ) : (
        <Card className="p-0 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Budget
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Actual
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                  Remaining
                </th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[100px] sm:min-w-[150px]">
                  Progress
                </th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {budgets.map((budget) => {
                const budgetAmt = parseFloat(budget.amount);
                const actualAmt = parseFloat(budget.actual_spent);
                const remainingAmt = parseFloat(budget.remaining);
                const percent = budgetAmt > 0 ? (actualAmt / budgetAmt) * 100 : 0;
                const isOver = remainingAmt < 0;

                return (
                  <tr key={budget.id}>
                    <td className="px-5 py-3 text-sm font-medium text-gray-900">
                      {categoryMap.get(budget.category_id) ?? `Category ${budget.category_id}`}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-gray-900">
                      {formatCurrency(budget.amount)}
                    </td>
                    <td className="px-5 py-3 text-sm text-right text-gray-900 hidden sm:table-cell">
                      {formatCurrency(budget.actual_spent)}
                    </td>
                    <td
                      className={`px-5 py-3 text-sm text-right font-medium hidden sm:table-cell ${
                        isOver ? 'text-red-600' : 'text-gray-900'
                      }`}
                    >
                      {formatCurrency(budget.remaining)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${
                            isOver ? 'bg-red-500' : 'bg-teal-500'
                          }`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(budget)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleting(budget)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Budget Modal */}
      <AddBudgetModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        categories={availableCategories}
        month={month}
        year={year}
        onSubmit={async (data) => {
          try {
            await createMutation.mutateAsync(data);
            toast.success('Budget created');
            setAddOpen(false);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to create');
          }
        }}
        isLoading={createMutation.isPending}
      />

      {/* Edit Budget Modal */}
      <EditBudgetModal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        budget={editing}
        categoryName={editing ? (categoryMap.get(editing.category_id) ?? '') : ''}
        onSubmit={async (amount) => {
          if (!editing) return;
          try {
            await updateMutation.mutateAsync({ id: editing.id, data: { amount } });
            toast.success('Budget updated');
            setEditing(null);
          } catch (e) {
            toast.error(e instanceof Error ? e.message : 'Failed to update');
          }
        }}
        isLoading={updateMutation.isPending}
      />

      <ConfirmDialog
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Delete Budget"
        message={`Delete the budget for ${categoryMap.get(deleting?.category_id ?? 0) ?? 'this category'}?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function AddBudgetModal({
  isOpen,
  onClose,
  categories,
  month,
  year,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  categories: { id: number; name: string }[];
  month: number;
  year: number;
  onSubmit: (data: BudgetCreate) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ category_id: number; amount: string }>();

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Budget" maxWidth="sm">
      <form
        onSubmit={handleSubmit((data) =>
          onSubmit({ category_id: data.category_id, month, year, amount: data.amount }),
        )}
      >
        <FormField label="Category" error={errors.category_id?.message}>
          <Select
            {...register('category_id', { required: 'Required', valueAsNumber: true })}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Budget Amount" error={errors.amount?.message}>
          <input
            {...register('amount', {
              required: 'Required',
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
              validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0',
            })}
            placeholder="0.00"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function EditBudgetModal({
  isOpen,
  onClose,
  budget,
  categoryName,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  budget: BudgetWithActual | null;
  categoryName: string;
  onSubmit: (amount: string) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{ amount: string }>();

  useEffect(() => {
    if (isOpen && budget) reset({ amount: budget.amount });
  }, [isOpen, budget, reset]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Budget: ${categoryName}`} maxWidth="sm">
      <form onSubmit={handleSubmit((data) => onSubmit(data.amount))}>
        <FormField label="Budget Amount" error={errors.amount?.message}>
          <input
            {...register('amount', {
              required: 'Required',
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
              validate: (v) => parseFloat(v) > 0 || 'Must be greater than 0',
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}
