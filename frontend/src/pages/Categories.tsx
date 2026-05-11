import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '../hooks/useCategories';
import { useToast } from '../hooks/useToast';
import type { Category, CategoryCreate } from '../types/category';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import FormField from '../components/FormField';
import PageHeader from '../components/PageHeader';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function Categories() {
  const { data: categories, isLoading, error } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (cat: Category) => {
    setEditing(cat);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMutation.mutateAsync(deleting.id);
      toast.success('Category deleted');
      setDeleting(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete');
    }
  };

  const defaults = categories?.filter((c) => c.is_default) ?? [];
  const custom = categories?.filter((c) => !c.is_default) ?? [];

  if (isLoading) return <LoadingSpinner />;
  if (error) return <p className="text-red-600 text-sm py-8 text-center">{error.message}</p>;

  return (
    <div>
      <PageHeader
        title="Categories"
        action={<Button onClick={handleAdd}>Add Category</Button>}
      />

      {categories?.length === 0 ? (
        <EmptyState
          title="No categories"
          description="Categories will appear here once the backend seeds defaults."
        />
      ) : (
        <div className="space-y-6">
          {defaults.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Default
              </h2>
              <Card className="divide-y divide-gray-100 p-0">
                {defaults.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color ?? '#9E9E9E' }}
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                      <Badge variant="neutral">Default</Badge>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                      Edit
                    </Button>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {custom.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Custom
              </h2>
              <Card className="divide-y divide-gray-100 p-0">
                {custom.map((cat) => (
                  <div key={cat.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: cat.color ?? '#9E9E9E' }}
                      />
                      <span className="text-sm font-medium text-gray-900">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(cat)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        category={editing}
        onSubmit={async (formData) => {
          try {
            if (editing) {
              await updateMutation.mutateAsync({ id: editing.id, data: formData });
              toast.success('Category updated');
            } else {
              await createMutation.mutateAsync(formData);
              toast.success('Category created');
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
        title="Delete Category"
        message={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function CategoryModal({
  isOpen,
  onClose,
  category,
  onSubmit,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onSubmit: (data: CategoryCreate) => void;
  isLoading: boolean;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CategoryCreate>();

  useEffect(() => {
    if (isOpen) {
      reset(
        category
          ? { name: category.name, color: category.color ?? '#9E9E9E' }
          : { name: '', color: '#0d9488' },
      );
    }
  }, [isOpen, category, reset]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={category ? 'Edit Category' : 'Add Category'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormField label="Name" error={errors.name?.message}>
          <input
            {...register('name', {
              required: 'Name is required',
              maxLength: { value: 50, message: 'Max 50 characters' },
            })}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </FormField>

        <FormField label="Color">
          <input
            type="color"
            {...register('color')}
            className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
          />
        </FormField>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isLoading}>
            {category ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
