import { Component, computed, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { cloudOfflineOutline, searchOutline } from 'ionicons/icons';

export type StateViewType = 'error' | 'empty';

@Component({
  selector: 'app-state-view',
  templateUrl: './state-view.component.html',
  styleUrls: ['./state-view.component.scss'],
  imports: [IonButton, IonIcon],
})
export class StateViewComponent {
  readonly type = input<StateViewType>('empty');
  readonly title = input<string>('');
  readonly message = input<string>('');
  readonly retry = output<void>();

  readonly icon = computed(() => (this.type() === 'error' ? 'cloud-offline-outline' : 'search-outline'));

  constructor() {
    addIcons({ cloudOfflineOutline, searchOutline });
  }
}
