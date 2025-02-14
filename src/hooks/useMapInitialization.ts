
import { useEffect, useRef, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UseMapInitializationProps {
  isDarkMap: boolean;
  onMapLoad: () => void;
}

export const useMapInitialization = ({ isDarkMap, onMapLoad }: UseMapInitializationProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    const initializeMap = async () => {
      try {
        // Get initial location before initializing map
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
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDarkMap 
            ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
            : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14
        });

        // Expose map instance globally
        (window as any).mapInstance = map.current;

        // Initialize GeolocateControl
        locationControlRef.current = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showAccuracyCircle: false,
          showUserLocation: true
        });

        map.current.addControl(locationControlRef.current);

        // Hide the default control UI
        setTimeout(() => {
          const geolocateControl = document.querySelector('.mapboxgl-ctrl-geolocate');
          if (geolocateControl) {
            (geolocateControl as HTMLElement).style.display = 'none';
          }
        }, 100);

        map.current.on('style.load', () => {
          onMapLoad();
        });
      } catch (error) {
        console.error('Error initializing map:', error);
        toast({
          variant: "destructive",
          title: "Error loading map",
          description: "Please check the Mapbox configuration and try again"
        });
      }
    };

    initializeMap();

    return () => {
      map.current?.remove();
    };
  }, [isDarkMap, onMapLoad, toast]);

  return { mapContainer, map, locationControlRef };
};
