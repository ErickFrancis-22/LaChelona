import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { CategoryWithCount } from '../models/category.model';
import { CategoryService } from './category.service';

const product = (id: number, categoryId: number) => ({
  id,
  code: `P-${id}`,
  name: `Producto ${id}`,
  category: { id: categoryId, name: `Categoría ${categoryId}` },
  package_type: 'CAJA',
  units_per_package: 24,
  sale_price: '22.50',
  stock: 10,
  image_url: null,
  available: true,
});

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

  it('should count products per category using /categories and /products in parallel', () => {
    let result: CategoryWithCount[] = [];
    service.getCategoriesWithCount().subscribe((categories) => (result = categories));

    http.expectOne(`${environment.apiUrl}/categories`).flush({
      data: [
        { id: 1, name: 'Cervezas', description: null, image_url: null, sort_order: 1 },
        { id: 2, name: 'Agua', description: null, image_url: null, sort_order: 2 },
      ],
    });
    http.expectOne(`${environment.apiUrl}/products`).flush({
      data: [product(1, 1), product(2, 1), product(3, 1)],
    });

    expect(result.map((c) => c.products_count)).toEqual([3, 0]);
  });
});
