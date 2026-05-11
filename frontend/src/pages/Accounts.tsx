import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useAccounts,
  useCreateAccount,
  useUpdateAccount,
  useDeleteAccount,
} from '../hooks/useAccounts';
import { useToast } from '../hooks/useToast';
import type { Account, AccountCreate } from '../types/account';
import { ACCOUNT_TYPE_OPTIONS, ASSET_TYPES } from '../types/enums';
import { formatCurrency, formatAccountType } from '../utils/format';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import Select from '../components/Select';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Accounts() {
  const { data, isLoading, error } = useAccounts();
  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<Account | null>(null);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Account deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const assets = data?.accounts.filter((a) => ASSET_TYPES.includes(a.type)) ?? [];
  const liabilities = data?.accounts.filter((a) => !ASSET_TYPES.includes(a.type)) ?? [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600 text-sm py-8 text-center">{error.message}</p>;

  return (
    <div>
      <PageHeader
        title="Accounts"
        action={
          <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Account
          </Button>
        }
      />

      {data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <p className="text-xs font-medium text-gray-500">Total Assets</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatCurrency(data.total_assets)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-gray-500">Total Liabilities</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatCurrency(data.total_liabilities)}
            </p>
          </Card>
          <Card>
            <p className="text-xs font-medium text-gray-500">Net Worth</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {formatCurrency(data.net_worth)}
            </p>
          </Card>
        </div>
      )}

      {data?.accounts.length === 0 ? (
        <EmptyState
          title="No accounts yet"
          description="Add your first account to start tracking your finances."
          action={
            <Button onClick={() => { setEditing(null); setModalOpen(true); }}>
              Add Account
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {assets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Assets
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => { setEditing(account); setModalOpen(true); }}
                    onDelete={() => setDeleting(account)}
                  />
                ))}
              </div>
            </div>
          )}
          {liabilities.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Liabilities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liabilities.map((account) => (
                  <AccountCard
                    key={account.id}
                    account={account}
                    onEdit={() => { setEditing(account); setModalOpen(true); }}
                    onDelete={() => setDeleting(account)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AccountModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        account={editing}
        onSubmit={async (formData) => {
          try {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, data: formData });
              toast.success('Account updated');
            } else {
              await createMutation.mutateAsync(formData);
              toast.success('Account created');
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
        title="Delete Account"
        message={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function AccountCard({
  account,
  onEdit,
  onDelete,
}: {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium text-gray-900">{account.name}</p>
          {account.institution && (
            <p className="text-xs text-gray-500 mt-0.5">{account.institution}</p>
          )}
        </div>
        <Badge variant="neutral">{formatAccountType(account.type)}</Badge>
      </div>
      <p className="text-xl font-semibold text-gray-900 mt-3">
        {formatCurrency(account.balance)}
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </Card>
  );
}

function AccountModal({
  isOpen,
  onClose,
  account,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  account: Account | null;
  onSubmit: (data: AccountCreate) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AccountCreate>();

  useEffect(() => {
    if (isOpen) {
      reset(
        account
          ? {
              name: account.name,
              type: account.type,
              balance: account.balance,
              institution: account.institution ?? '',
              notes: account.notes ?? '',
            }
          : { name: '', type: 'checking', balance: '0.00', institution: '', notes: '' },
      );
    }
  }, [isOpen, account, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={account ? 'Edit Account' : 'Add Account'}
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Name" error={errors.name?.message}>
          <input
            {...register('name', {
              required: 'Name is required',
              maxLength: { value: 100, message: 'Max 100 characters' },
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <FormField label="Type" error={errors.type?.message}>
          <Select
            {...register('type', { required: 'Type is required' })}
            options={ACCOUNT_TYPE_OPTIONS}
          />
        </FormField>

        <FormField label="Balance" error={errors.balance?.message}>
          <input
            {...register('balance', {
              required: 'Balance is required',
              pattern: { value: /^\d+(\.\d{1,2})?$/, message: 'Invalid amount' },
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <FormField label="Institution">
          <input
            {...register('institution')}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
            placeholder="e.g. Chase, Fidelity"
          />
        </FormField>

        <FormField label="Notes">
          <textarea
            {...register('notes')}
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {account ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
