import { Component } from '@angular/core';
import { IonIcon, IonLabel, IonTabBar, IonTabButton, IonTabs } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { clipboardOutline, homeOutline, personOutline } from 'ionicons/icons';

// Contenedor de las pestañas del cliente; cada pestaña conserva su propio historial de navegación
@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
})
export class TabsPage {
  constructor() {
    addIcons({ clipboardOutline, homeOutline, personOutline });
  }
}
