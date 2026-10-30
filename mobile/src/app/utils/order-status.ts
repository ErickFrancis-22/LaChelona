import { OrderStatus } from '../models/order.model';

// Traducción de los estados de la API (inglés) para la interfaz
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  IN_TRANSIT: 'En camino',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

// Mensaje bajo el estado en la tarjeta del pedido en curso
export const ORDER_STATUS_MESSAGES: Partial<Record<OrderStatus, string>> = {
  PENDING: 'Recibimos tu pedido. Lo revisaremos en breve.',
  CONFIRMED: 'Estamos preparando tu pedido.',
  IN_TRANSIT: 'Tu pedido va en camino a tu negocio.',
};

// Pedidos "en curso": todavía no se entregan ni se cancelan
const ACTIVE_STATUSES: readonly OrderStatus[] = ['PENDING', 'CONFIRMED', 'IN_TRANSIT'];

export const isActiveOrder = (status: OrderStatus): boolean => ACTIVE_STATUSES.includes(status);

// Ej. 998 → "#0998"
export const formatOrderNumber = (id: number): string => `#${String(id).padStart(4, '0')}`;
