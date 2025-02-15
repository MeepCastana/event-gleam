
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
          description: "Mapbox token not found in configuration. Please make sure it's set in Supabase."
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

      // Initialize map with default location first
      map.current = new mapboxgl.Map({
        container: mapContainer.current!,
        style: isDarkMap 
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
        center: [0, 0], // Default center
        zoom: 2 // Default zoom
      });

      locationControlRef.current = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
          timeout: 2000,
          maximumAge: 0
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
        showUserLocation: true,
        fitBoundsOptions: {
          animate: false
        }
      });

      map.current.addControl(locationControlRef.current);

      const removeGeolocateControl = () => {
        const geolocateControl = document.querySelector('.mapboxgl-ctrl-geolocate');
        if (geolocateControl && geolocateControl.parentElement) {
          geolocateControl.parentElement.remove();
        }
      };

      map.current.on('style.load', () => {
        console.log('Style loaded, updating heatmap...');
        setMapLoaded(true);
        updateHeatmap();
        removeGeolocateControl();
      });

      map.current.on('load', () => {
        console.log('Map loaded, starting location tracking...');
        removeGeolocateControl();

        // Try to get location after map is loaded
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            map.current?.flyTo({
              center: [longitude, latitude],
              zoom: 14,
              essential: true
            });
          },
          (error) => {
            console.error('Error getting initial location:', error);
            toast({
              variant: "destructive",
              title: "Location Error",
              description: "Unable to get your location. Please enable location services."
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 2000,
            maximumAge: 0
          }
        );
      });

      const updateInterval = setInterval(updateHeatmap, 30000);

      return () => {
        clearInterval(updateInterval);
        map.current?.remove();
      };

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: "Please check the Mapbox configuration and try again"
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
