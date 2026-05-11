import api from './client';
import type { Category, CategoryCreate, CategoryUpdate } from '../types/category';

export const categoriesApi = {
  list: () =>
    api.get<Category[]>('/categories/').then((r) => r.data),

  get: (id: number) =>
    api.get<Category>(`/categories/${id}`).then((r) => r.data),

  create: (data: CategoryCreate) =>
    api.post<Category>('/categories/', data).then((r) => r.data),

  update: (id: number, data: CategoryUpdate) =>
    api.patch<Category>(`/categories/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/categories/${id}`),
};
