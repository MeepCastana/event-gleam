
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/components/ui/use-toast";

export const useLocationStorage = () => {
  const { toast } = useToast();

  const storeLocation = async (position: GeolocationPosition, userId: string) => {
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
      } as any);

    if (error) {
      console.error('Error storing location:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to store location data"
      });
    }
  };

  const updateTrackingSettings = async (userId: string, status: 'active' | 'stopped') => {
    if (!userId) return;

    const { error } = await supabase
      .from('tracking_settings')
      .upsert({
        user_id: userId,
        status,
        high_accuracy: true,
        background_enabled: true
      } as any);

    if (error) {
      console.error('Error updating tracking settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update tracking settings"
      });
    }
  };

  return {
    storeLocation,
    updateTrackingSettings
  };
};
