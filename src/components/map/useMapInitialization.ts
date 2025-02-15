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
              const poi = e.features[0].properties;
              console.log('Clicked POI:', poi);
              
              // Get emoji based on POI type
              let emoji = '📍'; // default marker
              const type = poi.type?.toLowerCase() || '';
              
              if (type.includes('bar') || type.includes('pub')) {
                emoji = '🍺';
              } else if (type.includes('restaurant') || type.includes('food')) {
                emoji = '🍽️';
              } else if (type.includes('hotel') || type.includes('hostel')) {
                emoji = '🏨';
              } else if (type.includes('mall') || type.includes('shopping')) {
                emoji = '🛍️';
              } else if (type.includes('plaza') || type.includes('square')) {
                emoji = '🏛️';
              } else if (type.includes('cafe') || type.includes('coffee')) {
                emoji = '☕';
              } else if (type.includes('park')) {
                emoji = '🌳';
              } else if (type.includes('hospital') || type.includes('clinic')) {
                emoji = '🏥';
              } else if (type.includes('school') || type.includes('university')) {
                emoji = '🎓';
              } else if (type.includes('church') || type.includes('cathedral')) {
                emoji = '⛪';
              }

              // Create popup with styled content
              new mapboxgl.Popup({
                closeButton: true,
                closeOnClick: true,
                maxWidth: '300px',
                className: isDarkMap ? 'dark-theme-popup' : 'light-theme-popup'
              })
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="
                    padding: 12px;
                    background-color: ${isDarkMap ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)'};
                    color: ${isDarkMap ? '#fff' : '#000'};
                    border-radius: 8px;
                    font-family: system-ui, -apple-system, sans-serif;
                    backdrop-filter: blur(8px);
                  ">
                    <div style="font-size: 24px; margin-bottom: 8px; text-align: center;">
                      ${emoji}
                    </div>
                    <h3 style="
                      margin: 0 0 8px 0;
                      font-weight: 600;
                      font-size: 16px;
                      text-align: center;
                    ">${poi.name || 'Unnamed Location'}</h3>
                    ${poi.type ? `
                      <p style="
                        margin: 0 0 8px 0;
                        opacity: 0.7;
                        font-size: 14px;
                        text-align: center;
                      ">${poi.type}</p>
                    ` : ''}
                    ${poi.address ? `
                      <p style="
                        margin: 0;
                        font-size: 13px;
                        opacity: 0.6;
                        text-align: center;
                      ">${poi.address}</p>
                    ` : ''}
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
