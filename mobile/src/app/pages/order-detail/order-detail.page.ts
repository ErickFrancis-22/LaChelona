import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  NavController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircleOutline, calendarOutline, chevronBack, imageOutline, locationOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { OrderDetail, OrderItem } from '../../models/order.model';
import { PackageType } from '../../models/product.model';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { OrderStatusBadgeComponent } from '../../components/order-status-badge/order-status-badge.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';
import { formatDateTime } from '../../utils/date-format';
import { formatOrderNumber } from '../../utils/order-status';
import { pastelColor } from '../../utils/pastel-color';

type LoadStatus = 'loading' | 'ready' | 'error' | 'not-found';

const PACKAGE_LABELS: Record<PackageType, string> = {
  FARDO: 'Fardo',
  CAJA: 'Caja',
};

// Detalle de un pedido del cliente (GET orders/{id}); se abre desde el pedido en curso o desde el historial
@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.page.html',
  styleUrls: ['./order-detail.page.scss'],
  imports: [
    CurrencyPipe,
    IonHeader,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    OrderStatusBadgeComponent,
    StateViewComponent,
  ],
})
export class OrderDetailPage {
  private readonly orderService = inject(OrderService);
  private readonly auth = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly toastCtrl = inject(ToastController);
  private loadSub?: Subscription;

  // Parámetro :id de la ruta (withComponentInputBinding)
  readonly id = input.required<string>();

  readonly status = signal<LoadStatus>('loading');
  readonly order = signal<OrderDetail | null>(null);
  readonly skeletons = [1, 2];

  // El pedido no trae el nombre del negocio: se usa el guardado al iniciar sesión (o el del encargado)
  readonly businessName = signal<string | null>(null);

  // Ítems cuya imagen no cargó: se muestra el fondo pastel con el ícono de respaldo, igual que en el carrito
  readonly failedImages = signal<ReadonlySet<number>>(new Set());

  readonly title = computed(() => `Pedido ${formatOrderNumber(Number(this.id()))}`);

  // Solo las fechas que ya ocurrieron, en el orden del flujo
  readonly dates = computed(() => {
    const order = this.order();
    if (!order) {
      return [];
    }
    const entries: [string, string | null][] = [
      ['Pedido hecho', order.created_at],
      ['Confirmado', order.confirmed_at],
      ['En camino', order.in_transit_at],
      ['Entregado', order.delivered_at],
      ['Cancelado', order.cancelled_at],
    ];
    return entries
      .filter((entry): entry is [string, string] => !!entry[1])
      .map(([label, date]) => ({ label, value: formatDateTime(date) }));
  });

  constructor() {
    addIcons({ alertCircleOutline, calendarOutline, chevronBack, imageOutline, locationOutline });
  }

  // Se vuelve a consultar al entrar para mostrar el estado actual del pedido
  ionViewWillEnter(): void {
    this.businessName.set(this.auth.getBusinessName() ?? this.auth.getUserName());
    this.load();
  }

  onRefresh(event: Event): void {
    this.load(() => (event.target as HTMLIonRefresherElement).complete());
  }

  // Con datos en pantalla se actualiza sin skeletons; si esa actualización falla se conservan los datos y se avisa
  load(done?: () => void): void {
    const silent = this.status() === 'ready' && this.order()?.id === Number(this.id());
    if (!silent) {
      this.status.set('loading');
    }

    this.loadSub?.unsubscribe();
    this.loadSub = this.orderService.getOrder(Number(this.id())).subscribe({
      next: (order) => {
        this.order.set(order);
        this.status.set('ready');
        done?.();
      },
      error: (err: HttpErrorResponse) => {
        // 404: el pedido no existe o es de otro cliente
        if (err.status === 404) {
          this.status.set('not-found');
        } else if (silent) {
          this.showToast('No pudimos actualizar el pedido. Revisa tu conexión.');
        } else {
          this.status.set('error');
        }
        done?.();
      },
    });
  }

  // Ej. "Caja 24 u. · 2 × $22.50"
  itemLabel(item: OrderItem): string {
    const price = `$${item.unit_price.toFixed(2)}`;
    if (!item.product) {
      return `${item.quantity} × ${price}`;
    }
    const { package_type, units_per_package } = item.product;
    return `${PACKAGE_LABELS[package_type]} ${units_per_package} u. · ${item.quantity} × ${price}`;
  }

  showImage(item: OrderItem): boolean {
    return !!item.product?.image_url && !this.failedImages().has(item.id);
  }

  // El producto puede ya no existir: el color de respaldo se toma del ítem
  mediaColor(item: OrderItem): string {
    return this.showImage(item) ? '#ffffff' : pastelColor(item.product?.id ?? item.id);
  }

  onImageError(itemId: number): void {
    this.failedImages.update((ids) => new Set(ids).add(itemId));
  }

  goBack(): void {
    this.navCtrl.navigateBack('/tabs/orders');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      icon: 'alert-circle-outline',
      cssClass: 'toast-warning',
    });
    await toast.present();
  }
}
