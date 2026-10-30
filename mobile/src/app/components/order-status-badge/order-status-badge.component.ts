import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../../models/order.model';
import { ORDER_STATUS_LABELS } from '../../utils/order-status';

// Etiqueta del estado del pedido (historial y detalle); el color depende del estado
@Component({
  selector: 'app-order-status-badge',
  template: `<span class="badge" [class]="'badge badge--' + status().toLowerCase()">{{ label() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 3px 8px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      white-space: nowrap;
    }

    .badge--pending {
      background: #fff3cd;
      color: #8a6d00;
    }

    .badge--confirmed {
      background: #e3eafa;
      color: #1e2f55;
    }

    .badge--in_transit {
      background: #dff1fb;
      color: #0b5f86;
    }

    .badge--delivered {
      background: #e6e8ee;
      color: #3d4452;
    }

    .badge--cancelled {
      background: #fde2dc;
      color: #b4441d;
    }
  `,
})
export class OrderStatusBadgeComponent {
  readonly status = input.required<OrderStatus>();

  readonly label = computed(() => ORDER_STATUS_LABELS[this.status()]);
}
