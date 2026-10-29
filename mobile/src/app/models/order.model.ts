export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';

// El backend no valida ni guarda comentarios por producto: cada ítem lleva solo producto y cantidad
export interface CreateOrderItem {
  product_id: number;
  quantity: number;
}

export interface CreateOrderRequest {
  customer_comment: string | null;
  items: CreateOrderItem[];
}

// Solo se tipan los campos que usa la app; la respuesta también trae dirección de entrega y details.product
export interface Order {
  id: number;
  status: OrderStatus;
  total: string; // cast decimal:2 de Laravel, ej. "34.50"
  customer_comment: string | null;
  created_at: string;
}

export interface CreateOrderResponse {
  message: string;
  data: Order;
}
