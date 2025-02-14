
import { useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";

export const useMapControls = (
  map: MutableRefObject<mapboxgl.Map | null>,
  locationControlRef: MutableRefObject<mapboxgl.GeolocateControl | null>
) => {
  const { toast } = useToast();

  const centerOnLocation = useCallback(async () => {
    if (!locationControlRef.current) return;

    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'denied') {
        toast({
          title: "Location Access Required",
          description: "Please enable location access in your browser settings.",
          variant: "destructive"
        });
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current && locationControlRef.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              essential: true
            });
            locationControlRef.current.trigger();
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location.",
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error accessing location:', error);
      toast({
        title: "Location Error",
        description: "Unable to access location services.",
        variant: "destructive"
      });
    }
  }, [map, locationControlRef, toast]);

  return { centerOnLocation };
};
