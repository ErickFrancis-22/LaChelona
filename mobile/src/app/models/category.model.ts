export interface Category {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface CategoriesResponse {
  data: Category[];
}

// Category enriquecida en el frontend: /categories no devuelve el total de productos
export interface CategoryWithCount extends Category {
  products_count: number;
}
