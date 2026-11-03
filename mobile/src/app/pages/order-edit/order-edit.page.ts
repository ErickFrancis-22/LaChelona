import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonRouterOutlet,
  IonSkeletonText,
  IonTextarea,
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add,
  alertCircle,
  checkmarkCircle,
  chevronBack,
  imageOutline,
  locationOutline,
  lockClosedOutline,
  remove,
  trashOutline,
} from 'ionicons/icons';
import { Subscription, forkJoin } from 'rxjs';
import { CartItem } from '../../models/cart.model';
import { OrderDetail } from '../../models/order.model';
import { Product } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { OrderActionsService } from '../../services/order-actions.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { ProductPickerComponent } from '../../components/product-picker/product-picker.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';
import { isOrderLockedError, validationErrors, validationMessage } from '../../utils/order-errors';
import { ORDER_STATUS_LABELS, formatOrderNumber } from '../../utils/order-status';
import { packageLabel, stockMessage } from '../../utils/package-label';
import { pastelColor } from '../../utils/pastel-color';

// locked: el pedido ya no está PENDING (lo dice el backend, no el estado que se mostró antes)
type LoadStatus = 'loading' | 'ready' | 'error' | 'not-found' | 'locked';

// Mismo límite que valida el backend (customer_comment max:500)
const COMMENT_MAX_LENGTH = 500;

// Productos y nota tal como están guardados, para saber si hay cambios sin guardar
interface Snapshot {
  quantities: ReadonlyMap<number, number>;
  comment: string;
}

// Lo mínimo de un producto del pedido para cruzarlo con el catálogo
interface DraftEntry {
  productId: number | null;
  name: string;
  quantity: number;
}

// Edición de un pedido PENDING (PUT orders/{id}). Mismos bloques que "Tu pedido", pero sobre un borrador
// propio: nunca toca el carrito. Precio y stock se toman de GET products, igual que hará el backend al guardar
@Component({
  selector: 'app-order-edit',
  templateUrl: './order-edit.page.html',
  styleUrls: ['./order-edit.page.scss'],
  imports: [
    CurrencyPipe,
    FormsModule,
    IonHeader,
    IonContent,
    IonFooter,
    IonIcon,
    IonModal,
    IonSkeletonText,
    IonTextarea,
    ProductPickerComponent,
    StateViewComponent,
  ],
})
export class OrderEditPage {
  private readonly orderService = inject(OrderService);
  private readonly orderActions = inject(OrderActionsService);
  private readonly productService = inject(ProductService);
  private readonly auth = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly outlet = inject(IonRouterOutlet, { optional: true });
  private readonly alertCtrl = inject(AlertController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);
  private loadSub?: Subscription;

  // Parámetro :id de la ruta (withComponentInputBinding)
  readonly id = input.required<string>();

  readonly commentMaxLength = COMMENT_MAX_LENGTH;
  readonly packageLabel = packageLabel;
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly skeletons = [1, 2];

  readonly status = signal<LoadStatus>('loading');
  readonly order = signal<OrderDetail | null>(null);
  readonly items = signal<CartItem[]>([]);
  readonly comment = signal('');
  readonly pickerOpen = signal(false);
  readonly saving = signal(false);
  private readonly snapshot = signal<Snapshot | null>(null);

  // El pedido no trae el nombre del negocio: se usa el guardado al iniciar sesión (o el del encargado)
  readonly businessName = signal<string | null>(null);

  // Productos cuya imagen no cargó: se muestra el fondo pastel con el ícono de respaldo
  readonly failedImages = signal<ReadonlySet<number>>(new Set());

  readonly caption = computed(() => {
    const number = `Pedido ${formatOrderNumber(Number(this.id()))}`;
    const order = this.order();
    return order ? `${number} · ${ORDER_STATUS_LABELS[order.status]}` : number;
  });

  // Total visual con los precios actuales; el definitivo lo recalcula el backend al guardar
  readonly total = computed(() =>
    this.items().reduce((sum, { product, quantity }) => sum + product.sale_price * quantity, 0),
  );

  readonly productIds = computed(() => this.items().map(({ product }) => product.id));

  readonly hasChanges = computed(() => {
    const snapshot = this.snapshot();
    if (!snapshot) {
      return false;
    }
    const items = this.items();
    return (
      this.comment().trim() !== snapshot.comment ||
      items.length !== snapshot.quantities.size ||
      items.some(({ product, quantity }) => snapshot.quantities.get(product.id) !== quantity)
    );
  });

  constructor() {
    addIcons({
      add,
      alertCircle,
      checkmarkCircle,
      chevronBack,
      imageOutline,
      locationOutline,
      lockClosedOutline,
      remove,
      trashOutline,
    });
  }

  ionViewWillEnter(): void {
    this.businessName.set(this.auth.getBusinessName() ?? this.auth.getUserName());
    this.load();
  }

  // Siempre se consulta el pedido al backend: si ya no está PENDING no se deja editar
  load(): void {
    this.status.set('loading');
    this.loadSub?.unsubscribe();
    this.loadSub = forkJoin({
      order: this.orderService.getOrder(Number(this.id())),
      products: this.productService.getProducts(),
    }).subscribe({
      next: ({ order, products }) => {
        this.order.set(order);
        if (order.status !== 'PENDING') {
          this.status.set('locked');
          return;
        }
        const entries: DraftEntry[] = order.details.map((item) => ({
          productId: item.product?.id ?? null,
          name: item.product?.name ?? 'un producto',
          quantity: item.quantity,
        }));
        this.items.set(this.applyCatalog(entries, products));
        this.comment.set(order.customer_comment ?? '');
        this.snapshot.set({
          quantities: new Map(order.details.map((item) => [item.product?.id ?? -item.id, item.quantity])),
          comment: (order.customer_comment ?? '').trim(),
        });
        this.status.set('ready');
      },
      error: (err: HttpErrorResponse) => this.status.set(err.status === 404 ? 'not-found' : 'error'),
    });
  }

  // Cruza el pedido con el catálogo actual: quita lo inactivo o agotado y baja cantidades al stock,
  // porque el backend rechazaría el pedido completo (422 en `products`)
  private applyCatalog(entries: DraftEntry[], products: Product[]): CartItem[] {
    const catalog = new Map(products.map((product) => [product.id, product]));
    const removed: string[] = [];
    const adjusted: string[] = [];

    const items = entries.flatMap(({ productId, name, quantity }) => {
      const product = productId === null ? undefined : catalog.get(productId);
      if (!product || !product.available || product.stock < 1) {
        removed.push(name);
        return [];
      }
      if (quantity > product.stock) {
        adjusted.push(product.name);
      }
      return [{ product, quantity: Math.min(quantity, product.stock) }];
    });

    if (removed.length) {
      const verb = removed.length === 1 ? 'está disponible' : 'están disponibles';
      this.warn(`Quitamos ${removed.join(', ')} de tu pedido porque ya no ${verb}.`);
    } else if (adjusted.length) {
      this.warn(`Ajustamos la cantidad de ${adjusted.join(', ')} al stock disponible.`);
    }
    return items;
  }

  // Tras un 422 de stock: vuelve a pedir el catálogo y ajusta el borrador sin perder el resto de cambios
  private refreshProducts(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        const entries = this.items().map(({ product, quantity }) => ({
          productId: product.id,
          name: product.name,
          quantity,
        }));
        this.items.set(this.applyCatalog(entries, products));
      },
      error: () => undefined,
    });
  }

  increase(product: Product): void {
    const item = this.items().find((entry) => entry.product.id === product.id);
    if (!item) {
      return;
    }
    if (item.quantity >= product.stock) {
      this.warn(stockMessage(product));
      return;
    }
    this.setQuantity(product, item.quantity + 1);
  }

  // El backend exige al menos un producto: quitar el último ofrece cancelar el pedido
  async decrease(product: Product): Promise<void> {
    const item = this.items().find((entry) => entry.product.id === product.id);
    if (!item) {
      return;
    }
    if (item.quantity === 1 && this.items().length === 1) {
      await this.cancelOrder();
      return;
    }
    this.setQuantity(product, item.quantity - 1);
  }

  private setQuantity(product: Product, quantity: number): void {
    this.items.update((items) =>
      quantity < 1
        ? items.filter((item) => item.product.id !== product.id)
        : items.map((item) => (item.product.id === product.id ? { product, quantity } : item)),
    );
  }

  // Los productos nuevos entran con la cantidad elegida en el modal; se pueden seguir ajustando en la lista
  onProductsAdded(added: CartItem[]): void {
    this.pickerOpen.set(false);
    const current = new Set(this.productIds());
    this.items.update((items) => [...items, ...added.filter(({ product }) => !current.has(product.id))]);
  }

  async save(): Promise<void> {
    if (this.items().length === 0 || this.saving()) {
      return;
    }
    if (!this.hasChanges()) {
      this.leave();
      return;
    }

    this.saving.set(true);
    const loading = await this.loadingCtrl.create({ message: 'Guardando cambios...' });
    await loading.present();

    const id = Number(this.id());
    this.orderService.updateOrder(id, this.items(), this.comment()).subscribe({
      next: async () => {
        await loading.dismiss();
        this.saving.set(false);
        // Sin cambios pendientes para que salir no pida confirmación
        this.snapshot.set(null);
        this.leave();
        await this.showSuccess(`Pedido ${formatOrderNumber(id)} actualizado.`);
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        this.saving.set(false);
        await this.handleSaveError(err);
      },
    });
  }

  // El cliente conserva sus cambios salvo que el pedido ya no se pueda modificar
  private async handleSaveError(err: HttpErrorResponse): Promise<void> {
    if (isOrderLockedError(err)) {
      await this.orderActions.notifyLocked('modificar');
      this.load();
      return;
    }

    let header = 'No pudimos guardar los cambios';
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';
    if (err.status === 422) {
      header = 'Revisa tu pedido';
      message = validationMessage(err, message);
      // Stock o productos cambiaron desde que se abrió la edición
      if (validationErrors(err)['products']) {
        this.refreshProducts();
      }
    } else if (err.status === 404) {
      this.status.set('not-found');
      return;
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor. Tus cambios se conservan para intentarlo de nuevo.';
    }

    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }

  // Solo se llega aquí al quitar el último producto (el pedido no puede quedar vacío)
  private async cancelOrder(): Promise<void> {
    const result = await this.orderActions.confirmAndCancel(
      Number(this.id()),
      'Tu pedido debe tener al menos un producto. Si quitas el último, el pedido se cancelará y no se entregará.',
    );
    if (result === 'cancelled') {
      this.snapshot.set(null);
      this.leave();
    } else if (result === 'locked') {
      this.load();
    }
  }

  // Botón atrás y "Descartar cambios": si hay cambios sin guardar se confirma antes de salir
  async discard(): Promise<void> {
    if (this.status() !== 'ready' || !this.hasChanges()) {
      this.leave();
      return;
    }
    const alert = await this.alertCtrl.create({
      header: '¿Descartar los cambios?',
      message: 'Los cambios que hiciste en el pedido no se guardarán.',
      buttons: [
        { text: 'Seguir editando', role: 'cancel' },
        { text: 'Descartar', role: 'destructive', handler: () => this.leave() },
      ],
    });
    await alert.present();
  }

  // Vuelve a la pantalla de origen ("Mis pedidos" o el detalle), que recarga el pedido al entrar
  leave(): void {
    if (this.outlet?.canGoBack()) {
      this.navCtrl.back();
    } else {
      this.navCtrl.navigateBack(['/orders', this.id()]);
    }
  }

  viewDetail(): void {
    this.navCtrl.navigateBack(['/orders', this.id()]);
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

  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      icon: 'checkmark-circle',
      cssClass: 'toast-success',
    });
    await toast.present();
  }
}
