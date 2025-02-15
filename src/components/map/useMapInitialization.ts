
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

        // Initialize map with user's location and POI layer enabled
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: isDarkMap 
            ? 'mapbox://styles/mapbox/navigation-night-v1'  // Changed to navigation style for better POI visibility
            : 'mapbox://styles/mapbox/navigation-day-v1',   // Changed to navigation style for better POI visibility
          center: [longitude, latitude],
          zoom: 14,
          maxZoom: 19  // Allow closer zoom to see more POIs
        });

      } catch (locationError) {
        console.warn('Could not get initial location, using default:', locationError);
        // Fallback to default location - Deva coordinates
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: isDarkMap 
            ? 'mapbox://styles/mapbox/navigation-night-v1'
            : 'mapbox://styles/mapbox/navigation-day-v1',
          center: [22.9086, 45.8778], // Deva coordinates
          zoom: 14,
          maxZoom: 19
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

      // Add navigation control for easier zooming
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-left'
      );

      // Add custom CSS to position the controls
      const style = document.createElement('style');
      style.textContent = `
        .mapboxgl-ctrl-top-left {
          top: 80px !important;
          left: 15px !important;
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
        
        if (map.current) {
          // Ensure all POI layers are visible
          map.current.setLayoutProperty('poi-label', 'visibility', 'visible');
          map.current.setLayoutProperty('poi-label', 'text-size', 14);
          map.current.setLayoutProperty('poi-label', 'text-anchor', 'top');
          map.current.setLayoutProperty('poi-label', 'text-offset', [0, 1]);
          
          // Add 3D buildings
          const layers = map.current.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout && layer.layout['text-field']
          )?.id;

          map.current.addLayer(
            {
              'id': '3d-buildings',
              'source': 'composite',
              'source-layer': 'building',
              'filter': ['==', 'extrude', 'true'],
              'type': 'fill-extrusion',
              'minzoom': 14,
              'paint': {
                'fill-extrusion-color': isDarkMap ? '#2a2a2a' : '#aaa',
                'fill-extrusion-height': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'height']
                ],
                'fill-extrusion-base': [
                  'interpolate',
                  ['linear'],
                  ['zoom'],
                  15,
                  0,
                  15.05,
                  ['get', 'min_height']
                ],
                'fill-extrusion-opacity': 0.6
              }
            },
            labelLayerId
          );

          // Log POIs when clicking on them
          map.current.on('click', 'poi-label', (e) => {
            if (e.features && e.features[0]) {
              const poi = e.features[0];
              console.log('Clicked POI:', poi.properties);
              
              // Show a popup with POI information
              new mapboxgl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="color: ${isDarkMap ? '#fff' : '#000'}; padding: 8px;">
                    <h3 style="margin: 0 0 4px 0; font-weight: 600;">${poi.properties.name}</h3>
                    <p style="margin: 0; opacity: 0.7;">${poi.properties.type}</p>
                  </div>
                `)
                .addTo(map.current!);
            }
          });

          // Change cursor when hovering over POIs
          map.current.on('mouseenter', 'poi-label', () => {
            if (map.current) map.current.getCanvas().style.cursor = 'pointer';
          });
          
          map.current.on('mouseleave', 'poi-label', () => {
            if (map.current) map.current.getCanvas().style.cursor = '';
          });
        }

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
