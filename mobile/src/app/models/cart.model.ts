import { Product } from './product.model';

// Se guarda el producto completo para mostrar el carrito y calcular subtotales sin volver a consultar la API
export interface CartItem {
  product: Product;
  quantity: number;
}
