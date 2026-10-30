import { PackageType } from './product.model';

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

// GET orders: resumen de cada pedido (sin productos ni fechas por estado), del más reciente al más antiguo
export interface OrderSummary {
  id: number;
  status: OrderStatus;
  total: number;
  customer_comment: string | null;
  created_at: string;
}

export interface OrdersResponse {
  data: Order[];
}

// Solo los campos del producto que muestra el detalle; es null si el producto ya no existe
export interface OrderItemProduct {
  id: number;
  name: string;
  package_type: PackageType;
  units_per_package: number;
  image_url: string | null;
}

export interface OrderItem {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product: OrderItemProduct | null;
}

// GET orders/{id}: la dirección es la guardada al hacer el pedido, no la actual del perfil
export interface OrderDetail extends OrderSummary {
  confirmed_at: string | null;
  in_transit_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  delivery_address: string;
  delivery_reference: string | null;
  delivery_latitude: number | null;
  delivery_longitude: number | null;
  details: OrderItem[];
}

// Laravel serializa los decimales (total, unit_price, subtotal y coordenadas) como string
export interface ApiOrderItem extends Omit<OrderItem, 'unit_price' | 'subtotal'> {
  unit_price: string | number;
  subtotal: string | number;
}

export interface ApiOrderDetail
  extends Omit<OrderDetail, 'total' | 'delivery_latitude' | 'delivery_longitude' | 'details'> {
  total: string | number;
  delivery_latitude: string | number | null;
  delivery_longitude: string | number | null;
  details: ApiOrderItem[];
}

export interface OrderDetailResponse {
  data: ApiOrderDetail;
}
