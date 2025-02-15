
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { GeofenceArea } from '@/types/map';
import { useToast } from '@/components/ui/use-toast';

interface UseGeofencingProps {
  map: mapboxgl.Map | null;
  userId: string | null;
  onGeofenceEnter?: (area: GeofenceArea) => void;
  onGeofenceExit?: (area: GeofenceArea) => void;
}

export const useGeofencing = ({ map, userId, onGeofenceEnter, onGeofenceExit }: UseGeofencingProps) => {
  const [geofences, setGeofences] = useState<GeofenceArea[]>([]);
  const [activeGeofence, setActiveGeofence] = useState<GeofenceArea | null>(null);
  const { toast } = useToast();

  // Check if a point is within a geofence
  const isPointInGeofence = (lat: number, lon: number, fence: GeofenceArea) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat * Math.PI/180;
    const φ2 = fence.center[1] * Math.PI/180;
    const Δφ = (fence.center[1]-lat) * Math.PI/180;
    const Δλ = (fence.center[0]-lon) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance <= fence.radius;
  };

  // Add a new geofence
  const addGeofence = (fence: Omit<GeofenceArea, 'id'>) => {
    const newFence: GeofenceArea = {
      ...fence,
      id: crypto.randomUUID()
    };

    setGeofences(prev => [...prev, newFence]);

    if (map) {
      // Add geofence circle to map
      map.addSource(`geofence-${newFence.id}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: newFence.center
          },
          properties: {
            radius: newFence.radius
          }
        }
      });

      map.addLayer({
        id: `geofence-${newFence.id}`,
        type: 'circle',
        source: `geofence-${newFence.id}`,
        paint: {
          'circle-radius': ['get', 'radius'],
          'circle-color': '#4264fb',
          'circle-opacity': 0.2,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#4264fb'
        }
      });
    }

    toast({
      title: "Geofence Added",
      description: `New geofence "${newFence.name}" has been created.`
    });

    return newFence;
  };

  // Remove a geofence
  const removeGeofence = (id: string) => {
    setGeofences(prev => prev.filter(fence => fence.id !== id));

    if (map) {
      map.removeLayer(`geofence-${id}`);
      map.removeSource(`geofence-${id}`);
    }
  };

  // Check position against geofences
  const checkGeofences = (latitude: number, longitude: number) => {
    geofences.forEach(fence => {
      const isInside = isPointInGeofence(latitude, longitude, fence);
      
      if (isInside && (!activeGeofence || activeGeofence.id !== fence.id)) {
        setActiveGeofence(fence);
        onGeofenceEnter?.(fence);
        toast({
          title: "Entered Geofence",
          description: `You've entered ${fence.name}`
        });
      } else if (!isInside && activeGeofence?.id === fence.id) {
        setActiveGeofence(null);
        onGeofenceExit?.(fence);
        toast({
          title: "Left Geofence",
          description: `You've left ${fence.name}`
        });
      }
    });
  };

  return {
    geofences,
    activeGeofence,
    addGeofence,
    removeGeofence,
    checkGeofences
  };
};
