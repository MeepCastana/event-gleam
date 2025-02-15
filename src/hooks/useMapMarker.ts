
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { createLocationMarker } from '@/components/map/LocationMarker';

export const useMapMarker = (map: mapboxgl.Map | null, mapLoaded: boolean) => {
  const updateMarkerPosition = (longitude: number, latitude: number) => {
    if (!map || !mapLoaded) return;

    try {
      if (!map.hasImage('pulsing-dot')) {
        map.addImage('pulsing-dot', createLocationMarker({
          arrowColor: '#4287f5',
          dotSize: 60,
          map
        }), { pixelRatio: 2 });
      }

      if (!map.getSource('location')) {
        map.addSource('location', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        });
        map.addLayer({
          id: 'location',
          source: 'location',
          type: 'symbol',
          layout: {
            'icon-image': 'pulsing-dot',
            'icon-allow-overlap': true,
            'icon-rotate': 0
          }
        });
      } else {
        const source = map.getSource('location') as mapboxgl.GeoJSONSource;
        source.setData({
          type: 'Point',
          coordinates: [longitude, latitude]
        });
      }
    } catch (error) {
      console.error('Error updating location on map:', error);
    }
  };

  return { updateMarkerPosition };
};
