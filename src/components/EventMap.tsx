import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BottomDrawer } from "@/components/ui/bottom-drawer";

interface LocationMarkerProps {
  arrowColor?: string;
  dotSize?: number;
}

const LocationMarker: React.FC<LocationMarkerProps> = ({
  arrowColor = '#4287f5',
  dotSize = 200,
}) => {
  const size = dotSize;
  const pulsingDot = {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd: function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },
    render: function () {
      const duration = 1000;
      const t = performance.now() % duration / duration;
      const radius = size / 2 * 0.3;
      const outerRadius = size / 2 * 0.7 * t + radius;
      const context = this.context;

      // Clear the canvas
      context.clearRect(0, 0, this.width, this.height);

      // Draw the outer circle (pulsing effect)
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(66, 135, 245, ${1 - t})`;
      context.fill();

      // Draw the inner circle (location dot)
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle = arrowColor;
      context.strokeStyle = 'white';
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();

      // Draw the direction arrow
      if (window.deviceHeading !== undefined) {
        const arrowLength = radius * 2;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // Save the current context state
        context.save();
        
        // Move to center and rotate based on device heading
        context.translate(centerX, centerY);
        context.rotate((window.deviceHeading * Math.PI) / 180);
        
        // Draw the arrow
        context.beginPath();
        context.moveTo(0, -radius - arrowLength); // Arrow tip
        context.lineTo(-radius / 2, -radius); // Left side
        context.lineTo(radius / 2, -radius); // Right side
        context.closePath();
        
        // Style and fill the arrow
        context.fillStyle = arrowColor;
        context.fill();
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();
        
        // Restore the context to its original state
        context.restore();
      }

      // Update this image's data with data from the canvas
      this.data = context.getImageData(0, 0, this.width, this.height).data;

      // Continuously repaint the map
      map.triggerRepaint();

      return true;
    }
  };
  return pulsingDot;
};

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isDarkMap, setIsDarkMap] = useState(false);
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(true);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);

  const menuStyle = isDarkMap
    ? "bg-white/40 text-gray-900"
    : "bg-[#1A1F2C]/90 text-gray-100";

  // Extend window interface to store device heading
  declare global {
    interface Window {
      deviceHeading?: number;
    }
  }

  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      // Watch position instead of getting it once
      const watchId = navigator.geolocation.watchPosition(position => {
        const {
          longitude,
          latitude,
          heading
        } = position.coords;
        
        // Update device heading if available from GPS
        if (heading !== null) {
          window.deviceHeading = heading;
        }
        
        if (map.current && mapLoaded) {
          // Update map center without rotation
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });

          // Add or update the pulsing dot marker with direction
          if (!map.current.hasImage('pulsing-dot')) {
            map.current.addImage('pulsing-dot', LocationMarker({
              arrowColor: '#4287f5',
              dotSize: 200
            }), { pixelRatio: 2 });
          }

          try {
            // Add or update the location point
            if (!map.current.getSource('location')) {
              map.current.addSource('location', {
                type: 'geojson',
                data: {
                  type: 'Point',
                  coordinates: [longitude, latitude]
                }
              });
              map.current.addLayer({
                id: 'location',
                source: 'location',
                type: 'symbol',
                layout: {
                  'icon-image': 'pulsing-dot',
                  'icon-allow-overlap': true,
                  'icon-rotate': 0 // Keep the marker unrotated
                }
              });
            } else {
              const source = map.current.getSource('location') as mapboxgl.GeoJSONSource;
              source.setData({
                type: 'Point',
                coordinates: [longitude, latitude]
              });
            }
          } catch (error) {
            console.error('Error updating location:', error);
          }
        }
      }, error => {
        console.error('Error getting location:', error);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: "Unable to get your location. Please enable location services."
        });
      }, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      });

      // Setup device orientation handling
      if (window.DeviceOrientationEvent) {
        window.addEventListener('deviceorientation', event => {
          if (event.alpha !== null) {
            // Update the device heading without rotating the map
            window.deviceHeading = event.alpha;
          }
        });
      }

      return () => navigator.geolocation.clearWatch(watchId);
    } else {
      toast({
        variant: "destructive",
        title: "Location Error",
        description: "Geolocation is not supported by your browser."
      });
    }
  };

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
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: isDarkMap 
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
        center: [-74.5, 40],
        zoom: 9
      });

      map.current.on('style.load', () => {
        setMapLoaded(true);
      });

      // Watch for system color scheme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleColorSchemeChange = (e: MediaQueryListEvent) => {
        setIsDarkMap(e.matches);
        if (map.current) {
          map.current.setStyle(e.matches
            ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
            : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
          );
        }
      };
      mediaQuery.addEventListener('change', handleColorSchemeChange);

      return () => mediaQuery.removeEventListener('change', handleColorSchemeChange);
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: "Please check the Mapbox configuration and try again"
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
  };

  useEffect(() => {
    let cleanupLocation: (() => void) | undefined;
    const setupMap = async () => {
      await initializeMap();
    };
    setupMap();
    return () => {
      cleanupLocation?.();
      map.current?.remove();
    };
  }, []);

  // Effect for handling location after map is loaded
  useEffect(() => {
    let cleanupLocation: (() => void) | undefined;
    if (mapLoaded) {
      cleanupLocation = getUserLocation();
    }
    return () => cleanupLocation?.();
  }, [mapLoaded]);

  return (
    <div className="relative w-full h-screen">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center gap-3">
        <div className={`${menuStyle} backdrop-blur-lg shadow-lg p-2 rounded-full border border-white/10`}>
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className={`${menuStyle} backdrop-blur-lg shadow-lg px-6 py-3 rounded-full flex-1 border border-white/10`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-60" />
            <Input
              className="w-full pl-9 bg-white/10 border-none placeholder:text-inherit/60 rounded-full"
              placeholder="Search for fun"
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Bottom Drawer - Always visible */}
      <BottomDrawer
        isOpen={true}
        onClose={handleDrawerClose}
        initialHeight={isDrawerExpanded ? 75 : 30}
        maxHeight={75}
      >
        <div className={`${menuStyle} h-full rounded-t-[20px]`}>
          <div className="px-6 space-y-4">
            <h2 className="text-xl font-semibold mb-4">
              Nearby Events
            </h2>
            <div className="space-y-4">
              {[...Array(6)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-20 ${menuStyle} backdrop-blur-lg shadow-lg rounded-xl border border-white/10`}
                />
              ))}
            </div>
          </div>
        </div>
      </BottomDrawer>
    </div>
  );
};

export default EventMap;
