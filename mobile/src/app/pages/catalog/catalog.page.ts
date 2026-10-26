import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IonContent, IonHeader, IonIcon, IonSearchbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { imageOutline, locationOutline } from 'ionicons/icons';
import { EMPTY, Subject, catchError, debounceTime, switchMap, tap } from 'rxjs';
import { Category } from '../../models/category.model';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { CategoryService } from '../../services/category.service';
import { ProductService } from '../../services/product.service';
import { pastelColor } from '../../utils/pastel-color';
import { ClientFooterComponent } from '../../components/client-footer/client-footer.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { SkeletonCardComponent } from '../../components/skeleton-card/skeleton-card.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';

type LoadStatus = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-catalog',
  templateUrl: './catalog.page.html',
  styleUrls: ['./catalog.page.scss'],
  imports: [
    RouterLink,
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
export class CatalogPage {
  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly search$ = new Subject<string>();

  private readonly auth = inject(AuthService);

  // Nombre del negocio (o del encargado si no se pudo obtener); se relee al volver a la pestaña por si cambió en el perfil
  readonly deliveryName = signal(this.readDeliveryName());
  readonly skeletons = [1, 2, 3, 4];
  readonly pastelColor = pastelColor;

  readonly categories = signal<Category[]>([]);
  readonly status = signal<LoadStatus>('loading');
  readonly failedImages = signal<ReadonlySet<number>>(new Set());

  readonly searchTerm = signal('');
  readonly searchResults = signal<Product[]>([]);
  readonly searchStatus = signal<LoadStatus>('loading');

  constructor() {
    addIcons({ imageOutline, locationOutline });

    this.search$
      .pipe(
        debounceTime(300),
        switchMap((term) => {
          if (!term) {
            return EMPTY;
          }
          this.searchStatus.set('loading');
          return this.productService.getProducts({ search: term }).pipe(
            tap((products) => {
              this.searchResults.set(products);
              this.searchStatus.set('ready');
            }),
            catchError(() => {
              this.searchStatus.set('error');
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();

    this.loadCategories();
  }

  ionViewWillEnter(): void {
    this.deliveryName.set(this.readDeliveryName());
  }

  loadCategories(): void {
    this.status.set('loading');
    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  onSearch(event: Event): void {
    const term = ((event as CustomEvent<{ value?: string | null }>).detail.value ?? '').trim();
    this.searchTerm.set(term);
    this.searchStatus.set('loading');
    this.search$.next(term);
  }

  // Si la imagen no existe se muestra el fondo pastel en lugar del texto alternativo roto
  onImageError(categoryId: number): void {
    this.failedImages.update((ids) => new Set(ids).add(categoryId));
  }

  retrySearch(): void {
    this.search$.next(this.searchTerm());
  }

  private readDeliveryName(): string | null {
    return this.auth.getBusinessName() ?? this.auth.getUserName();
  }
}
