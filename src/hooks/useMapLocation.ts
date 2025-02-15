
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

    // First ensure map is fully loaded
    const ensureMapLoaded = () => {
      return new Promise<void>((resolve) => {
        if (map.current?.loaded()) {
          resolve();
        } else {
          map.current?.once('load', () => resolve());
        }
      });
    };

    // Then proceed with location handling
    const handleLocation = async () => {
      try {
        await ensureMapLoaded();
        
        // Trigger geolocate control to update user location on map
        if (locationControlRef.current) {
          locationControlRef.current.trigger();
        }

        // Get current position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            console.log("New location received:", latitude, longitude);

            const flyToOptions: mapboxgl.AnimationOptions & mapboxgl.CameraOptions = {
              center: [longitude, latitude] as [number, number],
              zoom: 14,
              duration: 1000,
              essential: true
            };

            if (map.current) {
              map.current.flyTo(flyToOptions);
            }

            isLocating.current = false;
          },
          (error) => {
            console.error("Location Error:", error);
            if (error.code === 1) {
              toast({
                variant: "destructive",
                title: "Permission Denied",
                description: "Please enable location services in your browser settings."
              });
            } else if (error.code === 2) {
              toast({
                variant: "destructive",
                title: "Location Unavailable",
                description: "Unable to determine your current position."
              });
            } else if (error.code === 3) {
              toast({
                variant: "destructive",
                title: "Timeout",
                description: "Location request took too long. Please try again."
              });
            }
            isLocating.current = false;
          },
          {
            enableHighAccuracy: true,
            timeout: 5000, // Increased timeout
            maximumAge: 0
          }
        );
      } catch (error) {
        console.error("Map operation error:", error);
        isLocating.current = false;
      }
    };

    handleLocation();
  }, [map, locationControlRef, toast]);

  return { centerOnLocation };
};
