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
  const lastUpdateTime = useRef<number>(Date.now());
  const restartAttempts = useRef<number>(0);
  const MAX_RESTART_ATTEMPTS = 3;

  // Function to handle location updates
  const handleLocationUpdate = async (position: GeolocationPosition) => {
    if (!userId || !mapLoaded) return;

    const { latitude, longitude, heading } = position.coords;
    const currentTime = Date.now();
    
    // Update last successful update time
    lastUpdateTime.current = currentTime;
    
    if (heading !== null) {
      window.deviceHeading = heading;
    }
    
    // Update map marker
    updateMarkerPosition(longitude, latitude);

    // Store location in database
    await storeLocation(position, userId);
  };

  // Add watchdog timer to detect tracking interruptions
  useEffect(() => {
    if (!isTracking) return;

    const watchdogInterval = setInterval(() => {
      const timeSinceLastUpdate = Date.now() - lastUpdateTime.current;
      
      // If no updates for more than 10 seconds, try to restart tracking
      if (timeSinceLastUpdate > 10000 && restartAttempts.current < MAX_RESTART_ATTEMPTS) {
        console.log('Location updates stopped, attempting to restart tracking...');
        stopTracking();
        startTracking();
        restartAttempts.current += 1;
      }
    }, 10000);

    return () => clearInterval(watchdogInterval);
  }, [isTracking]);

  // Reset restart attempts when tracking is manually started
  useEffect(() => {
    if (isTracking) {
      restartAttempts.current = 0;
    }
  }, [isTracking]);

  // Handle location errors
  const handleLocationError = (error: GeolocationPositionError) => {
    console.error('Location Error:', error);
    let errorMessage = "Unable to get your location. Please ensure location services are enabled.";
    
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Please enable location services in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information is unavailable. Please check your device's GPS.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out. Please try again.";
        break;
    }

    toast({
      variant: "destructive",
      title: "Location Error",
      description: errorMessage
    });
    stopTracking();
  };

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
      // Request permission first
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      if (permission.state === 'denied') {
        toast({
          variant: "destructive",
          title: "Location Access Denied",
          description: "Please enable location services in your browser settings."
        });
        return;
      }

      // Update tracking settings first
      await updateTrackingSettings(userId, 'active');

      // Get initial position
      navigator.geolocation.getCurrentPosition(
        handleLocationUpdate,
        handleLocationError,
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );

      // Start watching position
      watchId.current = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000
        }
      );

      setIsTracking(true);
      
      toast({
        title: "Location Tracking Started",
        description: "Your location is now being tracked."
      });
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
    
    toast({
      title: "Location Tracking Stopped",
      description: "Your location is no longer being tracked."
    });
  };

  // Ensure tracking is stopped when component unmounts
  useEffect(() => {
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        if (userId) {
          updateTrackingSettings(userId, 'stopped').catch(console.error);
        }
      }
    };
  }, [userId]);

  // Ensure tracking is stopped if map becomes unavailable
  useEffect(() => {
    if (!mapLoaded && isTracking) {
      stopTracking();
    }
  }, [mapLoaded]);

  return {
    isTracking,
    startTracking,
    stopTracking
  };
};
