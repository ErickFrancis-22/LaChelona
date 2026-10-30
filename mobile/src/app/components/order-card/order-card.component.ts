import { Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';
import { OrderSummary } from '../../models/order.model';
import { formatDay } from '../../utils/date-format';
import { formatOrderNumber } from '../../utils/order-status';
import { OrderStatusBadgeComponent } from '../order-status-badge/order-status-badge.component';

// Tarjeta del historial: GET orders no trae productos, así que solo muestra número, fecha, estado y total
@Component({
  selector: 'app-order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
  imports: [CurrencyPipe, IonIcon, OrderStatusBadgeComponent],
})
export class OrderCardComponent {
  readonly order = input.required<OrderSummary>();
  readonly open = output<void>();

  readonly title = computed(() => `${formatOrderNumber(this.order().id)} · ${formatDay(this.order().created_at)}`);

  constructor() {
    addIcons({ chevronForward });
  }
}
