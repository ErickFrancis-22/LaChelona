import * as L from 'leaflet';

// Pin propio con divIcon: el ícono por defecto de Leaflet busca imágenes que Angular no publica.
// Leaflet lo crea fuera de las vistas de Angular, por eso sus estilos (.location-pin) están en global.scss
export const PIN_ICON = L.divIcon({
  className: 'location-pin',
  html: '<span class="location-pin__head"></span>',
  iconSize: [32, 40],
  iconAnchor: [16, 36], // punta de la gota rotada
});
