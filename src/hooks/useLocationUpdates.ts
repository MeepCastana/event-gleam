
import { useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { requestNotificationPermission } from '@/utils/notifications';

interface UseLocationUpdatesProps {
  userId: string | null;
  enabled?: boolean;
}

export const useLocationUpdates = ({ userId, enabled = true }: UseLocationUpdatesProps) => {
  const lastPosition = useRef<GeolocationPosition | null>(null);
  const lastUpdate = useRef<number>(0);
  const MIN_DISTANCE = 10; // meters
  const MIN_TIME = 30000; // 30 seconds

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  const storeLocation = useCallback(async (position: GeolocationPosition) => {
    if (!userId) return;

    const now = Date.now();
    
    // Check if enough time has passed
    if (now - lastUpdate.current < MIN_TIME) {
      return;
    }

    // Check if we've moved enough
    if (lastPosition.current) {
      const distance = calculateDistance(
        lastPosition.current.coords.latitude,
        lastPosition.current.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      if (distance < MIN_DISTANCE) {
        return;
      }
    }

    try {
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
      } else {
        lastPosition.current = position;
        lastUpdate.current = now;
      }
    } catch (error) {
      console.error('Error in storeLocation:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId || !navigator.geolocation) return;

    // Request notification permission
    requestNotificationPermission();

    // Register service worker for background updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker registration successful');
          
          // Register for periodic sync if supported
          if ('periodicSync' in registration) {
            registration.periodicSync.register('location-update', {
              minInterval: 60000 // Minimum 1 minute
            }).catch(console.error);
          }
        })
        .catch((err) => {
          console.error('ServiceWorker registration failed:', err);
        });
    }

    // Set up location watching with battery-efficient options
    const watchId = navigator.geolocation.watchPosition(
      position => storeLocation(position),
      error => console.error('Error getting location:', error),
      {
        enableHighAccuracy: true,
        maximumAge: 30000,
        timeout: 5000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled, userId, storeLocation]);
};
