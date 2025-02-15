
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { createLocationMarker } from '@/components/map/LocationMarker';

export const useMapMarker = (map: mapboxgl.Map | null, mapLoaded: boolean) => {
  const updateMarkerPosition = (longitude: number, latitude: number) => {
    if (!map || !mapLoaded) return;

    try {
      // Clean up existing search marker layers and sources first
      if (map.getLayer('search-location')) {
        map.removeLayer('search-location');
      }
      if (map.getSource('search-location')) {
        map.removeSource('search-location');
      }

      // If coordinates are 0,0 or not provided, just clean up and return
      if (longitude === 0 && latitude === 0) {
        return;
      }

      // Wait for map style to be loaded before adding images and layers
      if (!map.isStyleLoaded()) {
        map.once('style.load', () => {
          addMarker(map, longitude, latitude);
        });
        return;
      }

      addMarker(map, longitude, latitude);
    } catch (error) {
      console.error('Error updating location on map:', error);
    }
  };

  const addMarker = (map: mapboxgl.Map, longitude: number, latitude: number) => {
    // Add pin marker image if it doesn't exist
    if (!map.hasImage('pin-marker')) {
      const pinImage = new Image();
      pinImage.onload = () => {
        if (!map.hasImage('pin-marker')) {
          map.addImage('pin-marker', pinImage);
          addMarkerLayer(map, longitude, latitude);
        }
      };
      pinImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#4287f5"/>
        </svg>
      `);
    } else {
      addMarkerLayer(map, longitude, latitude);
    }
  };

  const addMarkerLayer = (map: mapboxgl.Map, longitude: number, latitude: number) => {
    // Add the search location source and layer
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

    // Fly to the location
    map.flyTo({
      center: [longitude, latitude],
      zoom: 14,
      essential: true
    });
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      
      try {
        // Safely remove layer if it exists
        if (map.getStyle() && map.getLayer('search-location')) {
          map.removeLayer('search-location');
        }
        
        // Safely remove source if it exists
        if (map.getStyle() && map.getSource('search-location')) {
          map.removeSource('search-location');
        }
      } catch (e) {
        console.warn('Error cleaning up map marker:', e);
      }
    };
  }, [map]);

  return { updateMarkerPosition };
};
