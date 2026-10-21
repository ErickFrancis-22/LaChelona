import { Component } from '@angular/core';
import { IonContent, IonHeader, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { clipboardOutline } from 'ionicons/icons';

// Pantalla provisional para la pestaña; su contenido real se implementa en su propio ticket
@Component({
  selector: 'app-orders',
  templateUrl: './orders.page.html',
  styleUrls: ['./orders.page.scss'],
  imports: [IonHeader, IonContent, IonIcon],
})
export class OrdersPage {
  constructor() {
    addIcons({ clipboardOutline });
  }
}
