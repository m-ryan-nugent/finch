export interface Category {
  id: number;
  name: string;
  color: string | null;
  is_default: boolean;
  created_at: string;
}

export interface CategoryCreate {
  name: string;
  color?: string | null;
}

export interface CategoryUpdate {
  name?: string;
  color?: string | null;
}
