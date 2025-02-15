
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { createLocationMarker } from '@/components/map/LocationMarker';
import { supabase } from '@/integrations/supabase/client';

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

  // Store location in Supabase
  const storeLocation = async (position: GeolocationPosition) => {
    if (!userId) {
      console.error('No anonymous ID available');
      return;
    }

    const { error } = await supabase
      .from('user_locations')
      .insert({
        user_id: userId,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed,
        heading: position.coords.heading,
        altitude: position.coords.altitude,
        source: 'foreground'
      });

    if (error) {
      console.error('Error storing location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to store location data"
      });
    }
  };

  // Update tracking settings
  const updateTrackingSettings = async (status: 'active' | 'stopped') => {
    if (!userId) return;

    const { error } = await supabase
      .from('tracking_settings')
      .upsert({
        user_id: userId,
        status,
        high_accuracy: true,
        background_enabled: true
      });

    if (error) {
      console.error('Error updating tracking settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tracking settings"
      });
    }
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
      // Update tracking settings first
      await updateTrackingSettings('active');

      // Start watching position
      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, heading } = position.coords;
          
          if (heading !== null) {
            window.deviceHeading = heading;
          }
          
          if (map && mapLoaded) {
            // Update map marker
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
              console.error('Error updating location on map:', error);
            }
          }

          // Store location in database
          await storeLocation(position);
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

    await updateTrackingSettings('stopped');
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
