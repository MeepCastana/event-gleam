
import { useEffect, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseMapInitializationProps {
  mapContainer: MutableRefObject<HTMLDivElement | null>;
  map: MutableRefObject<mapboxgl.Map | null>;
  locationControlRef: MutableRefObject<mapboxgl.GeolocateControl | null>;
  isDarkMap: boolean;
  setMapLoaded: (loaded: boolean) => void;
  updateHeatmap: () => void;
}

export const useMapInitialization = ({
  mapContainer,
  map,
  locationControlRef,
  isDarkMap,
  setMapLoaded,
  updateHeatmap
}: UseMapInitializationProps) => {
  const { toast } = useToast();

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;
    try {
      const { data: config, error } = await supabase
        .from('_config')
        .select('value')
        .eq('name', 'MAPBOX_TOKEN')
        .maybeSingle();

      if (error) throw error;
      if (!config) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Mapbox token not found in configuration."
        });
        return;
      }

      const mapboxToken = config.value;
      if (!mapboxToken) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Invalid Mapbox token configuration"
        });
        return;
      }

      mapboxgl.accessToken = mapboxToken;

      // First get user's location before initializing map
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });

        const { latitude, longitude } = position.coords;

        // Initialize map with user's location
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: isDarkMap 
            ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
            : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
          center: [longitude, latitude],
          zoom: 14
        });

      } catch (locationError) {
        console.warn('Could not get initial location, using default:', locationError);
        // Fallback to default location
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: isDarkMap 
            ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
            : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
          center: [0, 0],
          zoom: 2
        });
      }

      // Initialize location control with custom position
      locationControlRef.current = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
        showUserLocation: true
      });

      // Add control in custom position (top-left)
      map.current.addControl(locationControlRef.current, 'top-left');

      // Add custom CSS to position the geolocate control
      const style = document.createElement('style');
      style.textContent = `
        .mapboxgl-ctrl-top-left {
          top: 75px !important;
          left: 13px !important;
        }
        .mapboxgl-ctrl-group {
          background-color: ${isDarkMap ? 'rgba(63, 63, 70, 0.9)' : 'rgba(24, 24, 27, 0.95)'} !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          backdrop-filter: blur(8px);
        }
        .mapboxgl-ctrl-group button {
          width: 32px !important;
          height: 32px !important;
        }
        .mapboxgl-ctrl-icon {
          filter: invert(1) sepia(1) saturate(5) hue-rotate(175deg);
        }
        .mapboxgl-ctrl-group button:focus:not(:focus-visible) {
          background-color: transparent;
        }
        .mapboxgl-ctrl-group button.mapboxgl-ctrl-geolocate:not(.mapboxgl-ctrl-geolocate-active):not(.mapboxgl-ctrl-geolocate-background) .mapboxgl-ctrl-icon {
          opacity: 0.8;
        }
      `;
      document.head.appendChild(style);

      // Set up map event handlers
      map.current.on('load', () => {
        console.log('Map loaded, enabling location tracking...');
        setMapLoaded(true);
        updateHeatmap();
        
        // Trigger location tracking automatically
        setTimeout(() => {
          locationControlRef.current?.trigger();
        }, 1000);
      });

      // Update heatmap periodically
      const updateInterval = setInterval(updateHeatmap, 30000);

      return () => {
        clearInterval(updateInterval);
        style.remove();
        map.current?.remove();
      };

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: "Please check your internet connection and try again"
      });
      return () => {};
    }
  };

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const setupMap = async () => {
      cleanup = await initializeMap();
    };
    setupMap();
    return () => {
      cleanup?.();
      map.current?.remove();
    };
  }, []);
};
