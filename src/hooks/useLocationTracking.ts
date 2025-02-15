
import { useState } from 'react';
import { useLocationStorage } from '@/utils/locationStorage';

export const useLocationTracking = (userId: string | null) => {
  const [isTracking, setIsTracking] = useState(false);
  const { storeLocation, updateTrackingSettings } = useLocationStorage();

  const startTracking = async () => {
    if (!userId) {
      console.error('No user ID available');
      return;
    }

    try {
      // Update tracking settings
      await updateTrackingSettings(userId, 'active');
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
    }
  };

  const stopTracking = async () => {
    if (!userId) return;

    try {
      await updateTrackingSettings(userId, 'stopped');
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  };

  return {
    isTracking,
    startTracking,
    stopTracking
  };
};
