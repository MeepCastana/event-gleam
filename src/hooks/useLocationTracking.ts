
import { useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { createLocationMarker } from '@/components/map/LocationMarker';

declare global {
  interface Window {
    deviceHeading?: number;
  }
}

interface UseLocationTrackingProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
}

export const useLocationTracking = ({ map, mapLoaded }: UseLocationTrackingProps) => {
  const { toast } = useToast();

  useEffect(() => {
    if (!mapLoaded) return;

    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(position => {
        const { longitude, latitude, heading } = position.coords;
        
        if (heading !== null) {
          window.deviceHeading = heading;
        }
        
        if (map && mapLoaded) {
          // Remove the automatic flyTo
          
          if (!map.hasImage('pulsing-dot')) {
            map.addImage('pulsing-dot', createLocationMarker({
              arrowColor: '#4287f5',
              dotSize: 60,
              map
            }), { pixelRatio: 2 });
          }

          try {
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
            console.error('Error updating location:', error);
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Unable to update your location on the map."
            });
          }
        }
      }, error => {
        console.error('Error getting location:', error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get your location. Please enable location services."
        });
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      });

      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', event => {
          if (event.alpha !== null) {
            window.deviceHeading = event.alpha;
          }
        });
      }

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported by your browser."
      });
    }
  }, [map, mapLoaded, toast]);
};
