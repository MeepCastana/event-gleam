
import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLocationUpdatesProps {
  userId: string | null;
  enabled?: boolean;
}

export const useLocationUpdates = ({ userId, enabled = true }: UseLocationUpdatesProps) => {
  const storeLocation = useCallback(async (position: GeolocationPosition) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });

      if (error) {
        console.error('Error storing location:', error);
      }
    } catch (error) {
      console.error('Error in storeLocation:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (!enabled || !userId || !navigator.geolocation) return;

    // Initial location update
    navigator.geolocation.getCurrentPosition(
      position => storeLocation(position),
      error => console.error('Error getting location:', error),
      { enableHighAccuracy: true }
    );

    // Set up periodic updates
    const intervalId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        position => storeLocation(position),
        error => console.error('Error getting location:', error),
        { enableHighAccuracy: true }
      );
    }, 30000); // Update every 30 seconds

    return () => {
      clearInterval(intervalId);
    };
  }, [enabled, userId, storeLocation]);
};
