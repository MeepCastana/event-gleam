import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "vaul";

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const {
    toast
  } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);
  const createPulsingDot = (map: mapboxgl.Map) => {
    const size = 200;
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

        // Draw the outer circle
        context.clearRect(0, 0, this.width, this.height);
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
        context.fillStyle = `rgba(66, 135, 245, ${1 - t})`;
        context.fill();

        // Draw the inner circle
        context.beginPath();
        context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
        context.fillStyle = 'rgba(66, 135, 245, 1)';
        context.strokeStyle = 'white';
        context.lineWidth = 2 + 4 * (1 - t);
        context.fill();
        context.stroke();

        // Update this image's data with data from the canvas
        this.data = context.getImageData(0, 0, this.width, this.height).data;

        // Continuously repaint the map
        map.triggerRepaint();

        // Return `true` to let the map know that the image was updated
        return true;
      }
    };
    return pulsingDot;
  };
  const getUserLocation = () => {
    if ("geolocation" in navigator) {
      // Watch position instead of getting it once
      const watchId = navigator.geolocation.watchPosition(position => {
        const {
          longitude,
          latitude
        } = position.coords;
        if (map.current && mapLoaded) {
          // Update map center
          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            essential: true
          });

          // Add or update the pulsing dot marker
          if (!map.current.hasImage('pulsing-dot')) {
            map.current.addImage('pulsing-dot', createPulsingDot(map.current), {
              pixelRatio: 2
            });
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
                  'icon-allow-overlap': true
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
          if (map.current && event.alpha !== null) {
            // Rotate the map based on device orientation
            map.current.rotateTo(-event.alpha, {
              duration: 0
            });
          }
        });
      }

      // Cleanup function to stop watching position
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
      const {
        data: config,
        error
      } = await supabase.from('_config').select('value').eq('name', 'MAPBOX_TOKEN').maybeSingle();
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
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.5, 40],
        // Default center before getting user location
        zoom: 9
      });
      map.current.on('style.load', () => {
        setMapLoaded(true);
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
        <div className="glass p-2 rounded-full">
          <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="glass px-6 py-3 rounded-2xl flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="w-full pl-9 bg-white/10 border-none placeholder:text-muted-foreground rounded-xl"
              placeholder="Search for some magic..."
            />
          </div>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Bottom Drawer */}
      <Drawer.Root direction="bottom" dismissible>
        <DrawerContent className="fixed bottom-0 left-0 right-0 glass rounded-t-3xl">
          <div className="p-6">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <DrawerHeader>
              <DrawerTitle className="text-xl font-semibold mb-4">
                Nearby Events
              </DrawerTitle>
            </DrawerHeader>
            <div className="space-y-4 min-h-[200px] max-h-[80vh] overflow-y-auto">
              {/* Event cards will go here */}
            </div>
          </div>
        </DrawerContent>
      </Drawer.Root>
    </div>
  );
};

export default EventMap;
