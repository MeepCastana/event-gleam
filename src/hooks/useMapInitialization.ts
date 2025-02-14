
import { useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface UseMapInitializationProps {
  isDarkMap: boolean;
  onMapLoaded: () => void;
}

export const useMapInitialization = ({ isDarkMap, onMapLoaded }: UseMapInitializationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const setupMap = async () => {
      if (!mapContainer.current || map.current) return;
    
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { data: config, error } = await supabase
          .from('_config')
          .select('value')
          .eq('name', 'MAPBOX_TOKEN')
          .maybeSingle();

        if (error) {
          console.error('Error fetching Mapbox token:', error);
          throw error;
        }

        if (!config?.value) {
          console.error('Mapbox token not found in configuration');
          throw new Error('Mapbox token not found in configuration');
        }

        mapboxgl.accessToken = config.value;
        
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDarkMap 
            ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
            : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14
        });

        locationControlRef.current = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showAccuracyCircle: false,
          showUserLocation: true
        });

        map.current.addControl(locationControlRef.current);

        setTimeout(() => {
          const geolocateControl = document.querySelector('.mapboxgl-ctrl-geolocate');
          if (geolocateControl) {
            (geolocateControl as HTMLElement).style.display = 'none';
          }
        }, 100);

        map.current.on('style.load', onMapLoaded);

        const cleanupMap = () => {
          if (map.current) {
            // Remove controls first
            if (locationControlRef.current) {
              map.current.removeControl(locationControlRef.current);
              locationControlRef.current = null;
            }
            // Then remove the map
            map.current.remove();
            map.current = null;
          }
        };

        return cleanupMap;
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          variant: "destructive",
          title: "Error loading map",
          description: "Please check the Mapbox configuration and try again"
        });
      }
    };

    setupMap().then(cleanupFn => {
      cleanup = cleanupFn;
    });

    return () => {
      if (cleanup) {
        cleanup();
      } else if (map.current) {
        // Fallback cleanup if the main cleanup function wasn't set
        if (locationControlRef.current) {
          map.current.removeControl(locationControlRef.current);
          locationControlRef.current = null;
        }
        map.current.remove();
        map.current = null;
      }
    };
  }, [isDarkMap, onMapLoaded, toast]);

  return { mapContainer, map, locationControlRef };
};
