
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
          container: mapContainer.current,
          style: isDarkMap 
            ? 'mapbox://styles/mapbox/navigation-night-v1'
            : 'mapbox://styles/mapbox/navigation-day-v1',
          center: [longitude, latitude],
          zoom: 14,
          pitch: 45,
          bearing: 0,
          maxZoom: 19,
          projection: { name: 'globe' },
          antialias: true
        });

      } catch (locationError) {
        console.warn('Could not get initial location, using default:', locationError);
        // Fallback to default location
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: isDarkMap 
            ? 'mapbox://styles/mapbox/navigation-night-v1'
            : 'mapbox://styles/mapbox/navigation-day-v1',
          center: [22.9086, 45.8778],
          zoom: 14,
          pitch: 45,
          bearing: 0,
          maxZoom: 19,
          projection: { name: 'globe' },
          antialias: true
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

      // Add navigation control
      const navigationControl = new mapboxgl.NavigationControl({
        showCompass: true,
        showZoom: true,
        visualizePitch: true
      });
      map.current.addControl(navigationControl, 'top-left');

      // Add directions control
      const directions = new mapboxgl.Directions({
        accessToken: mapboxToken,
        unit: 'metric',
        profile: 'mapbox/walking',
        alternatives: true,
        congestion: true,
        language: 'en',
        steps: true,
        controls: {
          inputs: false,
          instructions: true,
          profileSwitcher: true
        },
        styles: [
          {
            id: 'directions-route-line',
            type: 'line',
            source: 'directions',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#4287f5',
              'line-width': 5,
              'line-opacity': 0.8
            },
            filter: ['all', ['in', '$type', 'LineString']]
          }
        ]
      });
      map.current.addControl(directions, 'top-right');

      // Handle long press to set destination
      let pressTimer: NodeJS.Timeout | null = null;
      let isDragging = false;

      map.current.on('mousedown', (e) => {
        if (isDragging) return;
        
        pressTimer = setTimeout(() => {
          const { lng, lat } = e.lngLat;
          
          // Get user's current location
          if (locationControlRef.current) {
            const userLocation = locationControlRef.current._lastKnownPosition;
            
            if (userLocation) {
              const { coords } = userLocation;
              
              // Set origin (user location) and destination (clicked point)
              directions.setOrigin([coords.longitude, coords.latitude]);
              directions.setDestination([lng, lat]);

              // Create a marker at the destination
              new mapboxgl.Marker({ color: '#4287f5' })
                .setLngLat([lng, lat])
                .addTo(map.current!);

              toast({
                title: "Navigation Started",
                description: "Route has been calculated to your selected destination.",
              });
            } else {
              toast({
                variant: "destructive",
                title: "Location Required",
                description: "Please enable location services to use navigation.",
              });
            }
          }
        }, 500); // 500ms hold time
      });

      map.current.on('mouseup', () => {
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });

      map.current.on('dragstart', () => {
        isDragging = true;
        if (pressTimer) {
          clearTimeout(pressTimer);
          pressTimer = null;
        }
      });

      map.current.on('dragend', () => {
        isDragging = false;
      });

      // Add location control in custom position (top-left)
      map.current.addControl(locationControlRef.current, 'top-left');

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
        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          overflow: hidden;
        }
        .mapboxgl-popup-close-button {
          padding: 4px 8px !important;
          color: ${isDarkMap ? '#fff' : '#000'} !important;
          font-size: 16px !important;
          opacity: 0.7;
          z-index: 1;
        }
        .mapboxgl-popup-close-button:hover {
          opacity: 1;
          background: none !important;
        }
        .dark-theme-popup .mapboxgl-popup-tip {
          border-top-color: rgba(24, 24, 27, 0.95) !important;
        }
        .light-theme-popup .mapboxgl-popup-tip {
          border-top-color: rgba(255, 255, 255, 0.95) !important;
        }
        .mapbox-directions-component {
          background: ${isDarkMap ? 'rgba(63, 63, 70, 0.9)' : 'rgba(24, 24, 27, 0.95)'} !important;
          color: ${isDarkMap ? '#fff' : '#fff'} !important;
        }
        .directions-control-directions {
          max-height: 300px;
          overflow-y: auto;
        }
      `;
      document.head.appendChild(style);

      // Set up map event handlers
      map.current.on('load', () => {
        console.log('Map loaded, enabling location tracking...');
        
        if (map.current) {
          map.current.addLayer({
            'id': 'filtered-pois',
            'type': 'symbol',
            'source': 'composite',
            'source-layer': 'poi_label',
            'layout': {
              'icon-image': [
                'coalesce',
                [
                  'match',
                  ['get', 'class'],
                  'hospital', 'hospital-15',
                  'police', 'police-15',
                  'fire_station', 'fire-station-15',
                  ['get', 'maki']
                ],
                [
                  'match',
                  ['get', 'maki'],
                  'bar', 'bar-15',
                  'restaurant', 'restaurant-15',
                  'lodging', 'lodging-15',
                  'mall', 'shop-15',
                  'shopping', 'shop-15',
                  'department_store', 'shop-15',
                  'hospital', 'hospital-15',
                  'police', 'police-15',
                  'fire_station', 'fire-station-15',
                  'clothing-store-15'
                ]
              ],
              'icon-size': 1.5,
              'icon-allow-overlap': true,
              'icon-ignore-placement': true,
              'text-field': ['get', 'name'],
              'text-size': 12,
              'text-offset': [0, 1.5],
              'text-anchor': 'top',
              'text-allow-overlap': false,
              'text-optional': true,
              'text-max-width': 8,
              'visibility': 'visible'
            },
            'paint': {
              'text-color': isDarkMap ? '#ffffff' : '#000000',
              'text-halo-color': isDarkMap ? '#000000' : '#ffffff',
              'text-halo-width': 1.5,
              'icon-opacity': 1,
              'icon-color': isDarkMap ? '#ffffff' : '#000000'
            },
            'filter': [
              "any",
              ["==", ["get", "class"], "hospital"],
              ["==", ["get", "class"], "police"],
              ["==", ["get", "class"], "fire_station"],
              ["==", ["get", "maki"], "bar"],
              ["==", ["get", "maki"], "restaurant"],
              ["==", ["get", "maki"], "lodging"],
              ["==", ["get", "maki"], "shopping"],
              ["==", ["get", "maki"], "mall"],
              ["in", ["get", "type"], ["literal", ["Bar", "Restaurant", "Hotel", "Plaza", "Mall", "Shopping Mall", "Shopping Center"]]]
            ]
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
