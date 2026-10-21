import { Component } from '@angular/core';
import { IonContent, IonHeader, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline } from 'ionicons/icons';

// Pantalla provisional para la pestaña; su contenido real se implementa en su propio ticket
@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  imports: [IonHeader, IonContent, IonIcon],
})
export class ProfilePage {
  constructor() {
    addIcons({ personOutline });
  }
}
