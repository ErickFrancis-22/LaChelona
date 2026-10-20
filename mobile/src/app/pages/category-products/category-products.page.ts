import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent, IonHeader, IonIcon, IonSearchbar, NavController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronBack } from 'ionicons/icons';
import { EMPTY, Subject, catchError, debounceTime, map, of, switchMap, tap } from 'rxjs';
import { Product } from '../../models/product.model';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { ClientFooterComponent } from '../../components/client-footer/client-footer.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';

type LoadStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-category-products',
  templateUrl: './category-products.page.html',
  styleUrls: ['./category-products.page.scss'],
  imports: [
    IonHeader,
    IonContent,
    IonIcon,
    IonSearchbar,
    ClientFooterComponent,
    ProductCardComponent,
    SkeletonCardComponent,
    StateViewComponent,
  ],
})
export class CategoryProductsPage implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly navCtrl = inject(NavController);
  private readonly search$ = new Subject<string>();

  // Parámetro :categoryId de la ruta (withComponentInputBinding)
  readonly categoryId = input.required<string>();

  readonly skeletons = [1, 2, 3, 4];
  readonly categoryName = signal('');
  readonly categoryFound = signal(true);
  readonly products = signal<Product[]>([]);
  readonly status = signal<LoadStatus>('loading');
  readonly searchTerm = signal('');

  readonly productsLabel = computed(() => {
    const total = this.products().length;
    return `${total} ${total === 1 ? 'producto' : 'productos'}`;
  });

  constructor() {
    addIcons({ chevronBack });

    this.search$
      .pipe(
        debounceTime(300),
        switchMap((term) =>
          this.productService.getProducts({ categoryId: Number(this.categoryId()), search: term }).pipe(
            tap((products) => {
              this.products.set(products);
              this.status.set('ready');
            }),
            catchError(() => {
              this.status.set('error');
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  ngOnInit(): void {
    // El catálogo envía el nombre en el state de la navegación para no pedir /categories otra vez
    const state = history.state as { categoryName?: string } | null;
    this.categoryName.set(state?.categoryName ?? '');
    this.load();
  }

  load(): void {
    const categoryId = Number(this.categoryId());
    this.status.set('loading');

    this.productService
      .getProducts({ categoryId, search: this.searchTerm() })
      .pipe(
        switchMap((products) => {
          const name = this.categoryName() || products[0]?.category.name;
          if (name) {
            return of({ products, name });
          }
          // Sin nombre (ej. recarga directa de una categoría vacía): solo aquí se consulta /categories
          return this.categoryService.getCategories().pipe(
            map((categories) => ({ products, name: categories.find((c) => c.id === categoryId)?.name ?? '' })),
          );
        }),
      )
      .subscribe({
        next: ({ products, name }) => {
          this.categoryName.set(name);
          this.categoryFound.set(!!name);
          this.products.set(products);
          this.status.set('ready');
        },
        error: () => this.status.set('error'),
      });
  }

  onSearch(event: Event): void {
    const term = ((event as CustomEvent<{ value?: string | null }>).detail.value ?? '').trim();
    this.searchTerm.set(term);
    this.status.set('loading');
    this.search$.next(term);
  }

  goBack(): void {
    this.navCtrl.navigateBack('/catalog');
  }
}
