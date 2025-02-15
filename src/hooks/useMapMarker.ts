
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { createLocationMarker } from '@/components/map/LocationMarker';

export const useMapMarker = (map: mapboxgl.Map | null, mapLoaded: boolean) => {
  const updateMarkerPosition = (longitude: number, latitude: number) => {
    if (!map || !mapLoaded) return;

    try {
      // Only proceed if coordinates are valid (not 0,0)
      if (longitude === 0 && latitude === 0) {
        // Remove the marker layer and source if they exist
        if (map.getLayer('location')) {
          map.removeLayer('location');
        }
        if (map.getSource('location')) {
          map.removeSource('location');
        }
        return;
      }

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

      // Fly to the location with appropriate zoom level
      map.flyTo({
        center: [longitude, latitude],
        zoom: 14,
        essential: true
      });
    } catch (error) {
      console.error('Error updating location on map:', error);
    }
  };

  return { updateMarkerPosition };
};
