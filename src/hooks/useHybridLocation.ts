
import { useEffect, useCallback, useRef } from 'react';
import { WebViewLocationManager } from '@/native/location/WebViewLocationManager';
import { supabase } from '@/integrations/supabase/client';
import { NativePosition, MIN_DISTANCE, MIN_TIME } from '@/native/location/LocationBridge';
import { calculateDistance } from '@/utils/locationUtils';

interface UseHybridLocationProps {
  userId: string | null;
  enabled?: boolean;
}

export const useHybridLocation = ({ userId, enabled = true }: UseHybridLocationProps) => {
  const lastPosition = useRef<NativePosition | null>(null);
  const lastUpdate = useRef<number>(0);
  const locationManager = useRef<WebViewLocationManager>(WebViewLocationManager.getInstance());

  const storeLocation = useCallback(async (position: NativePosition) => {
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
          source: 'hybrid'
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
    if (!enabled || !userId) return;

    locationManager.current.startLocationUpdates(
      {
        minDistance: MIN_DISTANCE,
        minTimeInterval: MIN_TIME,
        userId,
        enableHighAccuracy: true
      },
      {
        onLocation: (position) => {
          storeLocation(position);
        },
        onError: (error) => {
          console.error('Location error:', error);
        }
      }
    );

    return () => {
      locationManager.current.stopLocationUpdates();
    };
  }, [enabled, userId, storeLocation]);
};

