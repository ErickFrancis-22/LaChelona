import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { CartItem } from '../models/cart.model';
import {
  CreateOrderRequest,
  CreateOrderResponse,
  OrderDetail,
  OrderDetailResponse,
  OrderSummary,
  OrdersResponse,
} from '../models/order.model';
import { resolveImageUrl } from '../utils/image-url';

const toNumberOrNull = (value: string | number | null): number | null => (value === null ? null : Number(value));

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  // El backend recalcula precios y total, revisa el stock y toma la dirección guardada del cliente
  createOrder(items: CartItem[], customerComment: string): Observable<CreateOrderResponse> {
    const body: CreateOrderRequest = {
      customer_comment: customerComment.trim() || null,
      items: items.map(({ product, quantity }) => ({ product_id: product.id, quantity })),
    };
    return this.api.post<CreateOrderResponse>('orders', body);
  }

  // Pedidos del cliente autenticado, del más reciente al más antiguo
  getOrders(): Observable<OrderSummary[]> {
    return this.api
      .get<OrdersResponse>('orders')
      .pipe(map((res) => res.data.map((order) => ({ ...order, total: Number(order.total) }))));
  }

  // 404 si el pedido no existe o es de otro cliente
  getOrder(id: number): Observable<OrderDetail> {
    return this.api.get<OrderDetailResponse>(`orders/${id}`).pipe(
      map(({ data }) => ({
        ...data,
        total: Number(data.total),
        delivery_latitude: toNumberOrNull(data.delivery_latitude),
        delivery_longitude: toNumberOrNull(data.delivery_longitude),
        details: data.details.map((item) => ({
          ...item,
          unit_price: Number(item.unit_price),
          subtotal: Number(item.subtotal),
          product: item.product && { ...item.product, image_url: resolveImageUrl(item.product.image_url) },
        })),
      })),
    );
  }
}
