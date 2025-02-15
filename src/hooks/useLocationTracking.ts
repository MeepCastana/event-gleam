
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { useLocationStorage } from '@/utils/locationStorage';
import { useMapMarker } from '@/hooks/useMapMarker';

declare global {
  interface Window {
    deviceHeading?: number;
  }
}

interface UseLocationTrackingProps {
  map: mapboxgl.Map | null;
  mapLoaded: boolean;
  userId: string | null;
}

export const useLocationTracking = ({ map, mapLoaded, userId }: UseLocationTrackingProps) => {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const watchId = useRef<number | null>(null);
  const { storeLocation, updateTrackingSettings } = useLocationStorage();
  const { updateMarkerPosition } = useMapMarker(map, mapLoaded);

  // Start location tracking
  const startTracking = async () => {
    if (!userId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not generate anonymous ID"
      });
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

    try {
      // Update tracking settings first
      await updateTrackingSettings(userId, 'active');

      // Start watching position
      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, heading } = position.coords;
          
          if (heading !== null) {
            window.deviceHeading = heading;
          }
          
          // Update map marker
          updateMarkerPosition(longitude, latitude);

          // Store location in database
          await storeLocation(position, userId);
        },
        (error) => {
          console.error('Location Error:', error);
          toast({
            variant: "destructive",
            title: "Location Error",
            description: "Unable to get your location. Please ensure location services are enabled."
          });
          stopTracking();
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );

      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
      toast({
        variant: "destructive",
        title: "Tracking Error",
        description: "Unable to start location tracking."
      });
    }
  };

  // Stop location tracking
  const stopTracking = async () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }

    if (userId) {
      await updateTrackingSettings(userId, 'stopped');
    }
    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  return {
    isTracking,
    startTracking,
    stopTracking
  };
};
