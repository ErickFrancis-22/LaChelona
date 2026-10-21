import { Component } from '@angular/core';
import { IonFooter, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { chevronForward } from 'ionicons/icons';

// Barra de carrito sobre las pestañas (TabsPage): por ahora solo diseño, el carrito tiene su propio ticket
@Component({
  selector: 'app-client-footer',
  templateUrl: './client-footer.component.html',
  styleUrls: ['./client-footer.component.scss'],
  imports: [IonFooter, IonIcon],
})
export class ClientFooterComponent {
  constructor() {
    addIcons({ chevronForward });
  }
}
