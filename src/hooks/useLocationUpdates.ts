
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseLocationUpdatesProps {
  userId: string | null;
  enabled?: boolean;
}

export const useLocationUpdates = ({ userId, enabled = true }: UseLocationUpdatesProps) => {
  const initializeLocationUpdates = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      // Initialize location updates
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          source: 'initialization'
        });

      if (error) {
        console.error('Error initializing location updates:', error);
      }
    } catch (error) {
      console.error('Error in initializeLocationUpdates:', error);
    }
  }, [userId, enabled]);

  return { initializeLocationUpdates };
};
