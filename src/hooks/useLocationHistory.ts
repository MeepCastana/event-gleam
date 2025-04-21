
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LocationHistoryEntry } from '@/types/map';

interface UseLocationHistoryProps {
  userId: string | null;
}

type UserLocation = {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  created_at: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  source?: string;
};

export const useLocationHistory = ({ userId }: UseLocationHistoryProps) => {
  const [locations, setLocations] = useState<LocationHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLocations = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_locations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100) as { data: UserLocation[] | null, error: Error | null };

      if (error) {
        console.error('Error fetching location history:', error);
        return;
      }

      if (data) {
        const historyEntries: LocationHistoryEntry[] = data.map(entry => ({
          latitude: entry.latitude,
          longitude: entry.longitude,
          timestamp: entry.created_at,
          accuracy: entry.accuracy || undefined,
          speed: entry.speed || undefined,
          heading: entry.heading || undefined,
          user_id: entry.user_id,
          id: entry.id,
          created_at: entry.created_at
        }));

        setLocations(historyEntries);
      }
    } catch (error) {
      console.error('Error in fetchLocations:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLocations();
    
    // Subscribe to new locations
    const channel = supabase
      .channel('location_updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_locations',
          filter: `user_id=eq.${userId}`
        },
        () => {
          fetchLocations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, fetchLocations]);

  return {
    locations,
    isLoading,
    refreshLocations: fetchLocations
  };
};
