import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, imageOutline, remove } from 'ionicons/icons';
import { PackageType, Product } from '../../models/product.model';
import { CartService } from '../../services/cart.service';
import { pastelColor } from '../../utils/pastel-color';

const PACKAGE_LABELS: Record<PackageType, string> = {
  FARDO: 'Fardo',
  CAJA: 'Caja',
};

@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss'],
  imports: [CurrencyPipe, IonIcon],
})
export class ProductCardComponent {
  readonly cart = inject(CartService);
  readonly product = input.required<Product>();

  // Con cantidad 0 se muestra el botón amarillo "+"; con 1 o más, el control [- n +]
  readonly quantity = computed(() => this.cart.quantityOf(this.product().id));
  readonly canAdd = computed(() => this.product().available && this.product().stock > 0);

  // Si la imagen no existe se muestra el fondo pastel en lugar del texto alternativo roto
  readonly imageFailed = signal(false);

  readonly packageLabel = computed(() => {
    const product = this.product();
    return `${PACKAGE_LABELS[product.package_type]} ${product.units_per_package} u.`;
  });

  readonly showImage = computed(() => !!this.product().image_url && !this.imageFailed());

  // Las imágenes vienen con fondo blanco; el pastel queda solo para el ícono de respaldo
  readonly mediaColor = computed(() => (this.showImage() ? '#ffffff' : pastelColor(this.product().id)));

  constructor() {
    addIcons({ add, imageOutline, remove });
  }
}
