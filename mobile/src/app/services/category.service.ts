import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { CategoriesResponse, Category } from '../models/category.model';
import { resolveImageUrl } from '../utils/image-url';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);

  getCategories(): Observable<Category[]> {
    return this.api
      .get<CategoriesResponse>('categories')
      .pipe(map((res) => res.data.map((category) => ({ ...category, image_url: resolveImageUrl(category.image_url) }))));
  }
}
