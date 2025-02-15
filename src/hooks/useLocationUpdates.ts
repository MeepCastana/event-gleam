
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

interface UseLocationUpdatesProps {
  userId: string | null;
  enabled?: boolean;
}

export const useLocationUpdates = ({ userId, enabled = true }: UseLocationUpdatesProps) => {
  const { toast } = useToast();

  const initializeLocationUpdates = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      // Get current position first
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      // Initialize location updates with current position
      const { error } = await supabase
        .from('user_locations')
        .insert({
          user_id: userId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          source: 'initialization'
        });

      if (error) {
        console.error('Error initializing location updates:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to initialize location updates"
        });
      }
    } catch (error) {
      console.error('Error in initializeLocationUpdates:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to get current location"
      });
    }
  }, [userId, enabled, toast]);

  return { initializeLocationUpdates };
};
