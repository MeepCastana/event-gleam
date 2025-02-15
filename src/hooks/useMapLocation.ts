
import { useRef, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import mapboxgl from 'mapbox-gl';

interface UseMapLocationProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  locationControlRef: React.MutableRefObject<mapboxgl.GeolocateControl | null>;
}

export const useMapLocation = ({ map, locationControlRef }: UseMapLocationProps) => {
  const { toast } = useToast();
  const isLocating = useRef(false);

  const centerOnLocation = useCallback(() => {
    if (isLocating.current) return;

    if (!map.current) {
      console.log("Map not initialized");
      return;
    }

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Your browser does not support location services."
      });
      return;
    }

    isLocating.current = true;

    // Clear the flag after 5 seconds in case of any issues
    setTimeout(() => {
      isLocating.current = false;
    }, 5000);

    // First trigger geolocate control to update user location on map
    if (locationControlRef.current) {
      locationControlRef.current.trigger();
    }

    // Then get current position and center map
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("New location received:", latitude, longitude);

        const flyToOptions = {
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
          essential: true
        };

        // Ensure the map is properly loaded before attempting to fly to location
        if (map.current?.loaded()) {
          map.current.flyTo(flyToOptions);
        } else {
          // If map is not loaded, wait for it
          map.current?.once('load', () => {
            map.current?.flyTo(flyToOptions);
          });
        }

        isLocating.current = false;
      },
      (error) => {
        console.error("Location Error:", error);
        // Only show toast for actual errors, not when we successfully get the location
        if (error.code !== 0) {
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Please ensure location services are enabled in your browser."
          });
        }
        isLocating.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 0
      }
    );
  }, [map, locationControlRef, toast]);

  return { centerOnLocation };
};
