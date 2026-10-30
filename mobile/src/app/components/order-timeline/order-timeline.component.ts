import { Component, computed, input } from '@angular/core';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { checkmark } from 'ionicons/icons';
import { OrderDetail, OrderStatus, OrderSummary } from '../../models/order.model';
import { formatMoment } from '../../utils/date-format';
import { ORDER_STATUS_LABELS } from '../../utils/order-status';

// Las fechas por estado solo vienen en GET orders/{id}: si ese detalle falla se muestran los textos sin hora
export type TimelineOrder = OrderSummary & Partial<Pick<OrderDetail, 'confirmed_at' | 'in_transit_at' | 'delivered_at'>>;

type StepState = 'done' | 'current' | 'upcoming';

interface TimelineStep {
  label: string;
  hint: string;
  state: StepState;
}

const FLOW: readonly OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT', 'DELIVERED'];

// Línea de tiempo de la tarjeta del pedido en curso: Pendiente → Confirmado → En camino → Entregado
@Component({
  selector: 'app-order-timeline',
  templateUrl: './order-timeline.component.html',
  styleUrls: ['./order-timeline.component.scss'],
  imports: [IonIcon],
})
export class OrderTimelineComponent {
  readonly order = input.required<TimelineOrder>();

  readonly steps = computed<TimelineStep[]>(() => {
    const order = this.order();
    const currentIndex = FLOW.indexOf(order.status);
    const hints: Record<string, string> = {
      PENDING: `Recibido ${formatMoment(order.created_at)}`,
      CONFIRMED: order.confirmed_at ? `Confirmado ${formatMoment(order.confirmed_at)}` : 'Pendiente de confirmar',
      IN_TRANSIT: order.in_transit_at ? `Salió ${formatMoment(order.in_transit_at)}` : 'Sale hacia tu negocio',
      DELIVERED: order.delivered_at ? `Entregado ${formatMoment(order.delivered_at)}` : 'En tu negocio',
    };

    return FLOW.map((status, index) => ({
      label: ORDER_STATUS_LABELS[status],
      hint: hints[status],
      state: index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'upcoming',
    }));
  });

  constructor() {
    addIcons({ checkmark });
  }
}
