export type PackageType = 'FARDO' | 'CAJA';

export interface Product {
  id: number;
  code: string;
  name: string;
  category: {
    id: number;
    name: string;
  };
  package_type: PackageType;
  units_per_package: number;
  sale_price: number;
  stock: number;
  image_url: string | null;
  available: boolean;
}

// Laravel serializa sale_price (cast decimal:2) como string, ej. "22.50"
export interface ApiProduct extends Omit<Product, 'sale_price'> {
  sale_price: string | number;
}

export interface ProductsResponse {
  data: ApiProduct[];
}

export interface ProductFilters {
  categoryId?: number;
  search?: string;
}
