import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('should send category_id and search, and convert sale_price to number', () => {
    let result: Product[] = [];
    service.getProducts({ categoryId: 3, search: ' lager ' }).subscribe((products) => (result = products));

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/products`);
    expect(req.request.params.get('category_id')).toBe('3');
    expect(req.request.params.get('search')).toBe('lager');

    req.flush({
      data: [
        {
          id: 1,
          code: 'CER-001',
          name: 'Cerveza lager 355 ml',
          category: { id: 3, name: 'Cervezas' },
          package_type: 'CAJA',
          units_per_package: 24,
          sale_price: '22.50',
          stock: 5,
          image_url: null,
          available: true,
        },
      ],
    });

    expect(result[0].sale_price).toBe(22.5);
  });

  it('should omit empty filters', () => {
    service.getProducts({ search: '   ' }).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.apiUrl}/products`);
    expect(req.request.params.keys()).toEqual([]);
    req.flush({ data: [] });
  });
});
