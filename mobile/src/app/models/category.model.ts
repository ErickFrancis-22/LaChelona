export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  // Total de productos activos, calculado en el backend con withCount
  products_count: number;
}

export interface CategoriesResponse {
  data: Category[];
}
