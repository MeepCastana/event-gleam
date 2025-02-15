
import { useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import mapboxgl from 'mapbox-gl';

interface UseMapLocationProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  locationControlRef: React.MutableRefObject<mapboxgl.GeolocateControl | null>;
}

export const useMapLocation = ({ map, locationControlRef }: UseMapLocationProps) => {
  const { toast } = useToast();
  const lastLocation = useRef<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });

  const centerOnLocation = () => {
    if (!locationControlRef.current || !map.current) return;

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Your browser does not support location services."
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (
          lastLocation.current.latitude === latitude &&
          lastLocation.current.longitude === longitude
        ) {
          console.log("Location unchanged. Skipping re-center.");
          return;
        }

        console.log("User Location Updated:", latitude, longitude);

        lastLocation.current = { latitude, longitude };

        map.current?.flyTo({
          center: [longitude, latitude],
          zoom: 14,
          duration: 1000,
          essential: true
        });
      },
      (error) => {
        console.error("Location Error:", error.code, error.message);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: `Error Code ${error.code}: ${error.message}`
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );
  };

  return { centerOnLocation };
};
