import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { ApiService } from './api.service';
import { ProductService } from './product.service';
import { CategoriesResponse, Category, CategoryWithCount } from '../models/category.model';
import { resolveImageUrl } from '../utils/image-url';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);
  private readonly productService = inject(ProductService);

  getCategories(): Observable<Category[]> {
    return this.api
      .get<CategoriesResponse>('categories')
      .pipe(map((res) => res.data.map((category) => ({ ...category, image_url: resolveImageUrl(category.image_url) }))));
  }

  // /categories no incluye el conteo, así que se calcula con /products en paralelo
  getCategoriesWithCount(): Observable<CategoryWithCount[]> {
    return forkJoin({
      categories: this.getCategories(),
      products: this.productService.getProducts(),
    }).pipe(
      map(({ categories, products }) => {
        const counts = new Map<number, number>();
        for (const product of products) {
          counts.set(product.category.id, (counts.get(product.category.id) ?? 0) + 1);
        }
        return categories.map((category) => ({ ...category, products_count: counts.get(category.id) ?? 0 }));
      }),
    );
  }
}
