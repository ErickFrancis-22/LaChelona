import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { alertCircle } from 'ionicons/icons';
import { CartItem } from '../models/cart.model';
import { PackageType, Product } from '../models/product.model';

const CART_KEY = 'cart_items';

const PACKAGE_PLURALS: Record<PackageType, [string, string]> = {
  FARDO: ['fardo', 'fardos'],
  CAJA: ['caja', 'cajas'],
};

// Carrito global del cliente: vive en memoria (signals) y se respalda en localStorage para sobrevivir a recargas.
// Las cantidades son fardos o cajas cerradas y nunca superan el stock conocido del producto
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly toastCtrl = inject(ToastController);

  readonly items = signal<CartItem[]>(this.readStorage());

  readonly total = computed(() =>
    this.items().reduce((sum, item) => sum + item.product.sale_price * item.quantity, 0),
  );
  readonly count = computed(() => this.items().reduce((sum, item) => sum + item.quantity, 0));
  readonly isEmpty = computed(() => this.items().length === 0);

  constructor() {
    addIcons({ alertCircle });

    effect(() => {
      const items = this.items();
      if (items.length) {
        localStorage.setItem(CART_KEY, JSON.stringify(items));
      } else {
        localStorage.removeItem(CART_KEY);
      }
    });
  }

  quantityOf(productId: number): number {
    return this.items().find((item) => item.product.id === productId)?.quantity ?? 0;
  }

  add(product: Product): void {
    if (this.quantityOf(product.id) > 0) {
      this.increase(product);
      return;
    }
    if (!product.available || product.stock < 1) {
      this.warnStock(product);
      return;
    }
    this.items.update((items) => [...items, { product, quantity: 1 }]);
  }

  // Bloquea la suma si ya se alcanzó el stock que devolvió la API
  increase(product: Product): void {
    const quantity = this.quantityOf(product.id);
    if (quantity >= product.stock) {
      this.warnStock(product);
      return;
    }
    this.setQuantity(product, quantity + 1);
  }

  // Con cantidad 0 el producto sale del carrito y la tarjeta vuelve al botón "+"
  decrease(product: Product): void {
    this.setQuantity(product, this.quantityOf(product.id) - 1);
  }

  clear(): void {
    this.items.set([]);
  }

  // Actualiza precio, stock y disponibilidad con datos frescos de la API. Ajusta las cantidades que ya no alcanzan
  // y quita los productos agotados; solo toca los productos que vienen en la respuesta
  syncProducts(products: Product[]): void {
    const fresh = new Map(products.map((product) => [product.id, product]));
    const removed: string[] = [];
    const adjusted: string[] = [];
    let synced = false;

    const items = this.items().flatMap((item) => {
      const product = fresh.get(item.product.id);
      if (!product) {
        return [item];
      }
      synced = true;
      if (!product.available || product.stock < 1) {
        removed.push(product.name);
        return [];
      }
      if (item.quantity > product.stock) {
        adjusted.push(product.name);
      }
      return [{ product, quantity: Math.min(item.quantity, product.stock) }];
    });

    if (synced) {
      this.items.set(items);
    }

    if (removed.length) {
      this.warn(`Quitamos del carrito ${removed.join(', ')} porque ya no hay existencias.`);
    } else if (adjusted.length) {
      this.warn(`Ajustamos la cantidad de ${adjusted.join(', ')} al stock disponible.`);
    }
  }

  private setQuantity(product: Product, quantity: number): void {
    if (quantity < 1) {
      this.items.update((items) => items.filter((item) => item.product.id !== product.id));
      return;
    }
    this.items.update((items) =>
      items.map((item) => (item.product.id === product.id ? { product, quantity } : item)),
    );
  }

  private warnStock(product: Product): void {
    const [singular, plural] = PACKAGE_PLURALS[product.package_type];
    const message =
      product.stock < 1
        ? `${product.name} está agotado.`
        : product.stock === 1
          ? `Solo queda 1 ${singular} de ${product.name}.`
          : `Solo hay ${product.stock} ${plural} disponibles de ${product.name}.`;
    this.warn(message);
  }

  private async warn(message: string): Promise<void> {
    // Un solo aviso a la vez: si se toca "+" varias veces no se apilan
    await this.toastCtrl.getTop().then((toast) => toast?.dismiss());
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'top',
      icon: 'alert-circle',
      cssClass: 'toast-warning',
    });
    await toast.present();
  }

  private readStorage(): CartItem[] {
    try {
      const items = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
      return Array.isArray(items) ? items.filter((item) => item?.product?.id && item.quantity > 0) : [];
    } catch {
      return [];
    }
  }
}
