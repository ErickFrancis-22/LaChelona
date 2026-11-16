import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSearchbar,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, alertCircle, close, imageOutline, remove, trashOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { CartItem } from '../../models/cart.model';
import { Product } from '../../models/product.model';
import { ProductService } from '../../services/product.service';
import { StateViewComponent } from '../state-view/state-view.component';
import { packageLabel, stockMessage } from '../../utils/package-label';
import { pastelColor } from '../../utils/pastel-color';

type LoadStatus = 'loading' | 'ready' | 'error';

// Modal "Agregar productos" de la edición de un pedido. Trabaja solo con el pedido en edición,
// nunca con el carrito: devuelve los productos elegidos con su cantidad
@Component({
  selector: 'app-product-picker',
  templateUrl: './product-picker.component.html',
  styleUrls: ['./product-picker.component.scss'],
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonFooter,
    IonSearchbar,
    IonSkeletonText,
    StateViewComponent,
  ],
})
export class ProductPickerComponent {
  private readonly productService = inject(ProductService);
  private readonly toastCtrl = inject(ToastController);
  private loadSub?: Subscription;

  // Productos que ya están en el pedido: se muestran como "En el pedido"
  readonly excludedIds = input<readonly number[]>([]);

  readonly added = output<CartItem[]>();
  readonly closed = output<void>();

  readonly packageLabel = packageLabel;
  readonly skeletons = [1, 2, 3, 4];

  readonly status = signal<LoadStatus>('loading');
  readonly products = signal<Product[]>([]);
  readonly search = signal('');
  // Elegidos con su cantidad; se conservan al cambiar la búsqueda
  readonly selected = signal<ReadonlyMap<number, CartItem>>(new Map());
  readonly failedImages = signal<ReadonlySet<number>>(new Set());

  readonly hasSelection = computed(() => this.selected().size > 0);
  private readonly excluded = computed(() => new Set(this.excludedIds()));

  constructor() {
    addIcons({ add, alertCircle, close, imageOutline, remove, trashOutline });
    this.load();
  }

  // ion-searchbar ya aplica el debounce; el backend busca por nombre o código
  onSearch(event: Event): void {
    this.search.set((event as CustomEvent<{ value?: string | null }>).detail.value ?? '');
    this.load();
  }

  load(): void {
    this.status.set('loading');
    this.loadSub?.unsubscribe();
    this.loadSub = this.productService.getProducts({ search: this.search() }).subscribe({
      next: (products) => {
        this.products.set(products);
        this.status.set('ready');
      },
      error: () => this.status.set('error'),
    });
  }

  inOrder(product: Product): boolean {
    return this.excluded().has(product.id);
  }

  // 0 si no está elegido
  quantityOf(product: Product): number {
    return this.selected().get(product.id)?.quantity ?? 0;
  }

  soldOut(product: Product): boolean {
    return !product.available || product.stock < 1;
  }

  // Igual que en el catálogo: no se pasa del stock que devolvió la API y se avisa
  increase(product: Product): void {
    if (this.inOrder(product) || this.soldOut(product)) {
      return;
    }
    const quantity = this.quantityOf(product);
    if (quantity >= product.stock) {
      this.warn(stockMessage(product));
      return;
    }
    this.setQuantity(product, quantity + 1);
  }

  // En 0 deja de estar elegido
  decrease(product: Product): void {
    this.setQuantity(product, this.quantityOf(product) - 1);
  }

  private setQuantity(product: Product, quantity: number): void {
    this.selected.update((current) => {
      const next = new Map(current);
      if (quantity < 1) {
        next.delete(product.id);
      } else {
        next.set(product.id, { product, quantity });
      }
      return next;
    });
  }

  confirm(): void {
    this.added.emit([...this.selected().values()]);
  }

  showImage(product: Product): boolean {
    return !!product.image_url && !this.failedImages().has(product.id);
  }

  mediaColor(product: Product): string {
    return this.showImage(product) ? '#ffffff' : pastelColor(product.id);
  }

  onImageError(productId: number): void {
    this.failedImages.update((ids) => new Set(ids).add(productId));
  }

  private async warn(message: string): Promise<void> {
    // Un solo aviso a la vez: si se toca "+" varias veces no se apilan
    await this.toastCtrl.getTop().then((toast) => toast?.dismiss());
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      icon: 'alert-circle',
      cssClass: 'toast-warning',
    });
    await toast.present();
  }
}
