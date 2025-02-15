
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
    // Prevent multiple concurrent location requests
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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("New location received:", latitude, longitude);

        // Always center on the new position
        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
          essential: true
        });

        isLocating.current = false;
      },
      (error) => {
        console.error("Location Error:", error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get your location. Please ensure location services are enabled."
        });
        isLocating.current = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 3000,
        maximumAge: 0 // Always get a fresh position
      }
    );
  }, [map, toast]);

  return { centerOnLocation };
};
