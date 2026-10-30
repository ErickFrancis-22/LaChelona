import { Component, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import {
  AlertController,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonSkeletonText,
  IonTextarea,
  LoadingController,
  NavController,
  ToastController,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, checkmarkCircle, chevronBack, imageOutline, locationOutline, remove, trashOutline } from 'ionicons/icons';
import { PackageType, Product } from '../../models/product.model';
import { Profile } from '../../models/profile.model';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { ProductService } from '../../services/product.service';
import { ProfileService } from '../../services/profile.service';
import { StateViewComponent } from '../../components/state-view/state-view.component';
import { formatOrderNumber } from '../../utils/order-status';
import { pastelColor } from '../../utils/pastel-color';

type LoadStatus = 'loading' | 'ready' | 'error';

const PACKAGE_NAMES: Record<PackageType, [string, string]> = {
  FARDO: ['Fardo', 'fardo'],
  CAJA: ['Caja', 'caja'],
};

// Mismo límite que valida el backend (customer_comment max:500)
const COMMENT_MAX_LENGTH = 500;

// Pantalla "Tu pedido": revisa el carrito, muestra la dirección de entrega y envía POST orders
@Component({
  selector: 'app-cart',
  templateUrl: './cart.page.html',
  styleUrls: ['./cart.page.scss'],
  imports: [
    CurrencyPipe,
    FormsModule,
    IonHeader,
    IonContent,
    IonFooter,
    IonIcon,
    IonSkeletonText,
    IonTextarea,
    StateViewComponent,
  ],
})
export class CartPage {
  readonly cart = inject(CartService);
  private readonly orderService = inject(OrderService);
  private readonly productService = inject(ProductService);
  private readonly profileService = inject(ProfileService);
  private readonly navCtrl = inject(NavController);
  private readonly alertCtrl = inject(AlertController);
  private readonly loadingCtrl = inject(LoadingController);
  private readonly toastCtrl = inject(ToastController);

  readonly commentMaxLength = COMMENT_MAX_LENGTH;
  readonly profile = signal<Profile | null>(null);
  readonly profileStatus = signal<LoadStatus>('loading');
  readonly comment = signal('');

  // Productos cuya imagen no cargó: se muestra el fondo pastel con el ícono de respaldo
  readonly failedImages = signal<ReadonlySet<number>>(new Set());

  constructor() {
    addIcons({ add, checkmarkCircle, chevronBack, imageOutline, locationOutline, remove, trashOutline });
  }

  ionViewWillEnter(): void {
    this.loadProfile();
    this.refreshProducts();
  }

  // La app no envía la dirección (el backend usa la guardada); aquí solo se muestra al cliente
  loadProfile(): void {
    this.profileStatus.set('loading');
    this.profileService.getProfile().subscribe({
      next: (profile) => {
        this.profile.set(profile);
        this.profileStatus.set('ready');
      },
      error: () => this.profileStatus.set('error'),
    });
  }

  // Trae el catálogo completo para que precios y stock del carrito coincidan con lo que cobrará el backend.
  // Si falla se queda con los datos guardados: POST orders hace la validación definitiva
  private refreshProducts(): void {
    if (this.cart.isEmpty()) {
      return;
    }
    this.productService.getProducts().subscribe({
      next: (products) => this.cart.syncProducts(products, true),
      error: () => undefined,
    });
  }

  showImage(product: Product): boolean {
    return !!product.image_url && !this.failedImages().has(product.id);
  }

  mediaColor(product: Product): string {
    return this.showImage(product) ? '#ffffff' : pastelColor(product.id);
  }

  onImageError(productId: number): void {
    this.failedImages.update((ids) => new Set(ids).add(productId));
  }

  // Ej. "Caja 24 u. · $22.50 por caja"
  packageLabel(product: Product): string {
    const [label, unit] = PACKAGE_NAMES[product.package_type];
    return `${label} ${product.units_per_package} u. · $${product.sale_price.toFixed(2)} por ${unit}`;
  }

  goBack(): void {
    this.navCtrl.navigateBack('/tabs/catalog');
  }

  // Al quitar el último producto la pantalla ya no tiene nada que confirmar: se vuelve al catálogo
  decrease(product: Product): void {
    this.cart.decrease(product);
    if (this.cart.isEmpty()) {
      this.goBack();
    }
  }

  private clearAndLeave(): void {
    this.cart.clear();
    this.goBack();
  }

  async confirmClear(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: '¿Vaciar el carrito?',
      message: 'Se quitarán todos los productos de tu pedido.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Vaciar', role: 'destructive', handler: () => this.clearAndLeave() },
      ],
    });
    await alert.present();
  }

  async submit(): Promise<void> {
    if (this.cart.isEmpty()) {
      return;
    }

    const loading = await this.loadingCtrl.create({ message: 'Enviando pedido...' });
    await loading.present();

    this.orderService.createOrder(this.cart.items(), this.comment()).subscribe({
      next: async (res) => {
        await loading.dismiss();
        // Pedido creado: se vacía el carrito (memoria y localStorage) y "atrás" ya no vuelve a esta pantalla
        this.cart.clear();
        this.comment.set('');
        await this.navCtrl.navigateRoot('/tabs/orders');
        await this.showSuccess(`¡Pedido ${formatOrderNumber(res.data.id)} enviado!`);
      },
      error: async (err: HttpErrorResponse) => {
        await loading.dismiss();
        await this.showError(err);
      },
    });
  }

  // El carrito no se toca: el cliente ajusta su pedido y vuelve a confirmar
  private async showError(err: HttpErrorResponse): Promise<void> {
    let header = 'No pudimos enviar tu pedido';
    let message = 'Ocurrió un error inesperado. Intenta de nuevo.';

    if (err.status === 422) {
      const errors = (err.error?.errors ?? {}) as Record<string, string[]>;
      message = Object.values(errors).flat().join('\n') || (err.error?.message ?? message);
      // Stock o productos cambiaron desde la última carga: se refresca para que el carrito se ajuste solo
      if (errors['products']) {
        header = 'Revisa tu pedido';
        this.refreshProducts();
      }
    } else if (err.status === 0) {
      header = 'Sin conexión';
      message = 'No se pudo conectar con el servidor. Tu carrito se conserva para intentarlo de nuevo.';
    }

    const alert = await this.alertCtrl.create({ header, message, buttons: ['Aceptar'] });
    await alert.present();
  }

  private async showSuccess(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      icon: 'checkmark-circle',
      cssClass: 'toast-success',
    });
    await toast.present();
  }
}
