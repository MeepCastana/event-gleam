import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMap, setIsDarkMap] = useState(false);
  const [panelSize, setPanelSize] = useState(15); // Default size 15%
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);

  // Function to get menu background color based on map style
  const menuStyle = isDarkMap
    ? "bg-white/40 text-gray-900"
    : "bg-[#1A1F2C]/90 text-gray-100";

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
        style: 'mapbox://styles/mapbox/light-v11', // Start with light style
        center: [-74.5, 40],
        zoom: 9
      });

      // Listen for style changes to update menu colors
      map.current.on('style.load', () => {
        const style = map.current?.getStyle();
        setIsDarkMap(style?.name?.toLowerCase().includes('dark'));
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

  const handlePanelResize = (size: number) => {
    setPanelSize(size);
    setIsExpanded(size > 15);
  };

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

      {/* Draggable Bottom Panel */}
      <ResizablePanelGroup
        direction="vertical"
        className="fixed bottom-0 left-0 right-0 z-10"
      >
        <ResizablePanel defaultSize={85}>
          <div className="h-full" /> {/* Spacer for map content */}
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel
          defaultSize={15}
          minSize={15}
          maxSize={45}
          onResize={handlePanelResize}
          className="animate-panel-slide transition-transform duration-300 ease-in-out"
        >
          <div className={`${menuStyle} backdrop-blur-lg shadow-lg rounded-t-[32px] h-full border border-white/10`}>
            <div className="p-6">
              <div className="w-16 h-1.5 bg-black/20 dark:bg-white/20 rounded-full mx-auto" />
            </div>
            <div className="px-6 pb-6 space-y-4">
              <h2 className="text-xl font-semibold mb-4">
                Nearby Events
              </h2>
              <div className="space-y-4 overflow-y-auto">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`h-20 ${menuStyle} backdrop-blur-lg shadow-lg rounded-xl border border-white/10`} />
                ))}
              </div>
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default EventMap;
