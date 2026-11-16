import { Component, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';
import { CartService } from '../../services/cart.service';

// Barra de carrito sobre las pestañas: muestra el total en tiempo real y se oculta con el carrito vacío
@Component({
  selector: 'app-client-footer',
  templateUrl: './client-footer.component.html',
  styleUrls: ['./client-footer.component.scss'],
  imports: [CurrencyPipe, RouterLink, IonFooter, IonIcon],
})
export class ClientFooterComponent {
  readonly cart = inject(CartService);

  constructor() {
    addIcons({ chevronForward });
  }
}
