
import { Store } from 'lucide-react';
import { Marker } from 'mapbox-gl';
import { Business } from '@/types/business';

export class BusinessMarker {
  private marker: Marker;

  constructor(business: Business, onClick: () => void) {
    // Create a DOM element for the marker
    const el = document.createElement('div');
    el.className = 'business-marker';
    el.innerHTML = `<div class="p-2 bg-white rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
      ${Store}
    </div>`;
    
    el.addEventListener('click', onClick);

    // Create the marker
    this.marker = new Marker({
      element: el,
      anchor: 'bottom'
    })
      .setLngLat([business.longitude, business.latitude]);
  }

  // Add the marker to the map
  addTo(map: mapboxgl.Map) {
    this.marker.addTo(map);
    return this;
  }

  // Remove the marker from the map
  remove() {
    this.marker.remove();
  }
}
