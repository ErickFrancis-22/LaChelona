import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { Category } from '../models/category.model';
import { CategoryService } from './category.service';

describe('CategoryService', () => {
  let service: CategoryService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(CategoryService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should use products_count from /categories without requesting /products', () => {
    let result: Category[] = [];
    service.getCategories().subscribe((categories) => (result = categories));

    http.expectOne(`${environment.apiUrl}/categories`).flush({
      data: [
        { id: 1, name: 'Cervezas', description: null, image_url: null, sort_order: 1, products_count: 3 },
        { id: 2, name: 'Agua', description: null, image_url: null, sort_order: 2, products_count: 0 },
      ],
    });
    http.expectNone(`${environment.apiUrl}/products`);

    expect(result.map((c) => c.products_count)).toEqual([3, 0]);
  });
});
