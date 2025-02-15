
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
        if (map.getLayer('search-location')) {
          map.removeLayer('search-location');
        }
        if (map.getSource('search-location')) {
          map.removeSource('search-location');
        }
        return;
      }

      // Create a pin marker for search results
      if (!map.hasImage('pin-marker')) {
        const pinImage = new Image();
        pinImage.onload = () => {
          if (map.hasImage('pin-marker')) return;
          map.addImage('pin-marker', pinImage);
        };
        pinImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4287f5"/>
          </svg>
        `);
      }

      if (!map.getSource('search-location')) {
        map.addSource('search-location', {
          type: 'geojson',
          data: {
            type: 'Point',
            coordinates: [longitude, latitude]
          }
        });
        map.addLayer({
          id: 'search-location',
          source: 'search-location',
          type: 'symbol',
          layout: {
            'icon-image': 'pin-marker',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-anchor': 'bottom'
          }
        });
      } else {
        const source = map.getSource('search-location') as mapboxgl.GeoJSONSource;
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
