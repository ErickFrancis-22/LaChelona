import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward, clipboardOutline, homeOutline, personOutline } from 'ionicons/icons';

// Barra de carrito y pestañas: por ahora solo diseño; carrito, pedidos y perfil tienen sus propios tickets
@Component({
  selector: 'app-client-footer',
  templateUrl: './client-footer.component.html',
  styleUrls: ['./client-footer.component.scss'],
  imports: [RouterLink, RouterLinkActive, IonFooter, IonIcon],
})
export class ClientFooterComponent {
  constructor() {
    addIcons({ chevronForward, clipboardOutline, homeOutline, personOutline });
  }
}
