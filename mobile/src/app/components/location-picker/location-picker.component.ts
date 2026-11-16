import { Component, ElementRef, OnDestroy, afterNextRender, inject, input, output, signal, viewChild } from '@angular/core';
import { IonButton, IonButtons, IonContent, IonFooter, IonHeader, IonIcon, IonSpinner, IonTitle, IonToolbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { close, locateOutline } from 'ionicons/icons';
import * as L from 'leaflet';
import { PIN_ICON } from '../../utils/map-pin';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

// Si no hay permiso de ubicación el mapa arranca en Santa Tecla y el cliente mueve el pin a mano
const DEFAULT_CENTER: L.LatLngTuple = [13.6769, -89.2797];
const DEFAULT_ZOOM = 13;
const LOCATED_ZOOM = 17;

// La columna en `clients` es decimal(10,7)
const round = (value: number) => Number(value.toFixed(7));

@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
  imports: [IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonIcon, IonContent, IonFooter, IonSpinner],
})
export class LocationPickerComponent implements OnDestroy {
  readonly latitude = input<number | null>(null);
  readonly longitude = input<number | null>(null);

  readonly confirmed = output<Coordinates>();
  readonly cancelled = output<void>();

  private readonly mapElement = viewChild.required<ElementRef<HTMLDivElement>>('map');

  readonly locating = signal(false);
  readonly locationError = signal<string | null>(null);
  // Solo se puede confirmar cuando el pin viene del GPS, de una ubicación previa o lo movió el cliente
  readonly hasPosition = signal(false);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private map?: L.Map;
  private marker?: L.Marker;
  private resizeObserver?: ResizeObserver;
  private destroyed = false;

  constructor() {
    addIcons({ close, locateOutline });

    // El contenido se dibuja antes de que el modal termine de abrir (la primera vez además carga ion-modal):
    // si Leaflet se crea en ese momento el contenedor aún no tiene tamaño y el mapa queda en blanco
    afterNextRender(() => {
      const modal = this.host.nativeElement.closest('ion-modal');
      if (modal) {
        modal.addEventListener('ionModalDidPresent', () => this.initMap(), { once: true });
      } else {
        this.initMap();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.resizeObserver?.disconnect();
    this.map?.remove();
    // El GPS puede responder después de cerrar el modal: sin mapa, placeMarker no hace nada
    this.map = undefined;
    this.marker = undefined;
  }

  locate(): void {
    if (!navigator.geolocation) {
      this.locationError.set('Tu dispositivo no permite obtener la ubicación. Mueve el pin hasta tu negocio.');
      return;
    }

    this.locating.set(true);
    this.locationError.set(null);

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        this.locating.set(false);
        this.placeMarker([coords.latitude, coords.longitude], LOCATED_ZOOM);
      },
      (error) => {
        this.locating.set(false);
        this.locationError.set(
          error.code === error.PERMISSION_DENIED
            ? 'No diste permiso para usar tu ubicación. Mueve el pin hasta tu negocio.'
            : 'No pudimos obtener tu ubicación. Mueve el pin hasta tu negocio.',
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  confirm(): void {
    if (!this.marker) {
      return;
    }
    const { lat, lng } = this.marker.getLatLng();
    this.confirmed.emit({ latitude: round(lat), longitude: round(lng) });
  }

  private initMap(): void {
    if (this.destroyed || this.map) {
      return;
    }
    const lat = this.latitude();
    const lng = this.longitude();
    const initial: L.LatLngTuple | null = lat !== null && lng !== null ? [lat, lng] : null;

    this.map = L.map(this.mapElement().nativeElement, { zoomControl: false }).setView(
      initial ?? DEFAULT_CENTER,
      initial ? LOCATED_ZOOM : DEFAULT_ZOOM,
    );

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(this.map);

    this.marker = L.marker(initial ?? DEFAULT_CENTER, { icon: PIN_ICON, draggable: true }).addTo(this.map);
    this.marker.on('dragend', () => this.hasPosition.set(true));
    this.map.on('click', (event: L.LeafletMouseEvent) => this.placeMarker(event.latlng));

    // El modal se abre con animación: Leaflet calcula mal el tamaño si no se le avisa cuando cambia
    this.resizeObserver = new ResizeObserver(() => this.map?.invalidateSize());
    this.resizeObserver.observe(this.mapElement().nativeElement);

    if (initial) {
      this.hasPosition.set(true);
    } else {
      this.locate();
    }
  }

  private placeMarker(position: L.LatLngExpression, zoom?: number): void {
    if (!this.map || !this.marker) {
      return;
    }
    this.marker.setLatLng(position);
    if (zoom) {
      this.map.setView(position, zoom);
    }
    this.hasPosition.set(true);
  }
}
