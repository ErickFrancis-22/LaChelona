import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
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
import { alertCircleOutline, clipboardOutline, createOutline, informationCircle } from 'ionicons/icons';
import { Subscription, catchError, map, of, switchMap } from 'rxjs';
import { OrderStatus, OrderSummary } from '../../models/order.model';
import { OrderService } from '../../services/order.service';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { OrderTimelineComponent, TimelineOrder } from '../../components/order-timeline/order-timeline.component';
import { StateViewComponent } from '../../components/state-view/state-view.component';
import { ORDER_STATUS_LABELS, ORDER_STATUS_MESSAGES, formatOrderNumber, isActiveOrder } from '../../utils/order-status';

type LoadStatus = 'loading' | 'ready' | 'error';
type HistoryFilter = 'ALL' | 'DELIVERED' | 'CANCELLED';

// El historial se muestra de 5 en 5 con "Ver más pedidos"
const PAGE_SIZE = 5;

const FILTERS: { value: HistoryFilter; label: string; empty: string }[] = [
  { value: 'ALL', label: 'Todos', empty: 'Aún no tienes pedidos en tu historial.' },
  { value: 'DELIVERED', label: 'Entregados', empty: 'No tienes pedidos entregados.' },
  { value: 'CANCELLED', label: 'Cancelados', empty: 'No tienes pedidos cancelados.' },
];

// Pestaña "Mis pedidos": pedido en curso con su línea de tiempo e historial con filtros
@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  imports: [
    CurrencyPipe,
    IonHeader,
    IonContent,
    IonIcon,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    OrderCardComponent,
    OrderTimelineComponent,
    StateViewComponent,
  ],
})
export class OrdersPage {
  private readonly orderService = inject(OrderService);
  private readonly navCtrl = inject(NavController);
  private readonly router = inject(Router);
  private readonly toastCtrl = inject(ToastController);
  private loadSub?: Subscription;

  readonly filters = FILTERS;
  readonly skeletons = [1, 2, 3];
  readonly statusLabels = ORDER_STATUS_LABELS;
  readonly statusMessages = ORDER_STATUS_MESSAGES;
  readonly formatOrderNumber = formatOrderNumber;

  readonly status = signal<LoadStatus>('loading');
  readonly orders = signal<OrderSummary[]>([]);
  // Pedido en curso con sus fechas por estado (de GET orders/{id}); sin ellas la línea de tiempo no muestra horas
  readonly current = signal<TimelineOrder | null>(null);
  readonly filter = signal<HistoryFilter>('ALL');
  readonly visibleCount = signal(PAGE_SIZE);

  // El pedido en curso ya se ve en la tarjeta azul; los demás (incluidos otros activos) van al historial
  readonly history = computed(() => this.orders().filter((order) => order.id !== this.current()?.id));
  readonly filteredHistory = computed(() => {
    const filter = this.filter();
    return filter === 'ALL' ? this.history() : this.history().filter((order) => order.status === filter);
  });
  readonly visibleHistory = computed(() => this.filteredHistory().slice(0, this.visibleCount()));
  readonly hasMore = computed(() => this.filteredHistory().length > this.visibleCount());

  readonly emptyHistoryMessage = computed(() => {
    if (this.orders().length === 0) {
      return 'Aún no tienes pedidos registrados.';
    }
    return FILTERS.find((f) => f.value === this.filter())?.empty ?? '';
  });

  constructor() {
    addIcons({ alertCircleOutline, clipboardOutline, createOutline, informationCircle });
  }

  // Se consulta cada vez que se entra a la pestaña (también al llegar desde el carrito tras confirmar un pedido)
  ionViewWillEnter(): void {
    this.load();
  }

  onRefresh(event: Event): void {
    this.load(() => (event.target as HTMLIonRefresherElement).complete());
  }

  // Con datos en pantalla se actualiza sin skeletons; si esa actualización falla se conservan los datos y se avisa
  load(done?: () => void): void {
    const silent = this.status() === 'ready';
    if (!silent) {
      this.status.set('loading');
    }

    this.loadSub?.unsubscribe();
    this.loadSub = this.orderService
      .getOrders()
      .pipe(
        switchMap((orders) => {
          const active = orders.find((order) => isActiveOrder(order.status));
          if (!active) {
            return of({ orders, current: null });
          }
          // Si falla el detalle, la tarjeta se muestra igual con el resumen (sin horas por estado)
          return this.orderService.getOrder(active.id).pipe(
            catchError(() => of(active)),
            map((current) => ({ orders, current: current as TimelineOrder })),
          );
        }),
      )
      .subscribe({
        next: ({ orders, current }) => {
          this.orders.set(orders);
          this.current.set(current);
          this.status.set('ready');
          done?.();
        },
        error: () => {
          if (silent) {
            this.showToast('No pudimos actualizar tus pedidos. Revisa tu conexión.', 'alert-circle-outline');
          } else {
            this.status.set('error');
          }
          done?.();
        },
      });
  }

  setFilter(filter: HistoryFilter): void {
    this.filter.set(filter);
    this.visibleCount.set(PAGE_SIZE);
  }

  showMore(): void {
    this.visibleCount.update((count) => count + PAGE_SIZE);
  }

  openDetail(order: OrderSummary): void {
    this.navCtrl.navigateForward(['/orders', order.id]);
  }

  goToCatalog(): void {
    this.router.navigateByUrl('/tabs/catalog');
  }

  isPending(status: OrderStatus): boolean {
    return status === 'PENDING';
  }

  // Editar y cancelar se implementan en sus propios tickets
  comingSoon(): void {
    this.showToast('Esta opción estará disponible muy pronto.', 'information-circle');
  }

  private async showToast(message: string, icon: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      icon,
      cssClass: 'toast-warning',
    });
    await toast.present();
  }
}
