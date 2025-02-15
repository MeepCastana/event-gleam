
import { useRef, useCallback, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import mapboxgl from 'mapbox-gl';

interface UseMapLocationProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  locationControlRef: React.MutableRefObject<mapboxgl.GeolocateControl | null>;
}

export const useMapLocation = ({ map, locationControlRef }: UseMapLocationProps) => {
  const { toast } = useToast();
  const isLocating = useRef(false);

  const simulateTabSwitch = () => {
    console.log("Simulating tab switch...");
    document.dispatchEvent(new Event("visibilitychange"));
  };

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

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("New location received:", latitude, longitude);

        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
          essential: true
        });

        isLocating.current = false;

        // Trigger a fake tab switch after centering
        setTimeout(simulateTabSwitch, 100);
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
        maximumAge: 0
      }
    );
  }, [map, toast]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log("Tab hidden");
      } else {
        console.log("Tab visible again, refreshing location...");
        centerOnLocation(); // Re-run location function on tab switch
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [centerOnLocation]);

  return { centerOnLocation };
};
