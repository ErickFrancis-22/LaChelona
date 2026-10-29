import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { CartItem } from '../models/cart.model';
import { CreateOrderRequest, CreateOrderResponse } from '../models/order.model';

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
}
