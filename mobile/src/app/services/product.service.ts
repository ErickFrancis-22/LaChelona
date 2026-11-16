import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Product, ProductFilters, ProductsResponse } from '../models/product.model';
import { resolveImageUrl } from '../utils/image-url';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  getProducts(filters: ProductFilters = {}): Observable<Product[]> {
    let params = new HttpParams();

    if (filters.categoryId) {
      params = params.set('category_id', filters.categoryId);
    }

    const search = filters.search?.trim();
    if (search) {
      params = params.set('search', search);
    }

    return this.api
      .get<ProductsResponse>('products', params)
      .pipe(
        map((res) =>
          res.data.map((product) => ({
            ...product,
            sale_price: Number(product.sale_price),
            image_url: resolveImageUrl(product.image_url),
          })),
        ),
      );
  }
}
