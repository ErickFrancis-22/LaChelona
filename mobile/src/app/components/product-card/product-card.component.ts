import { Component, computed, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { add, imageOutline } from 'ionicons/icons';
import { PackageType, Product } from '../../models/product.model';
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
  readonly product = input.required<Product>();

  // Si la imagen no existe se muestra el fondo pastel en lugar del texto alternativo roto
  readonly imageFailed = signal(false);

  readonly packageLabel = computed(() => {
    const product = this.product();
    return `${PACKAGE_LABELS[product.package_type]} ${product.units_per_package} u.`;
  });

  readonly mediaColor = computed(() => pastelColor(this.product().id));

  constructor() {
    addIcons({ add, imageOutline });
  }
}
