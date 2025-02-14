
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";

const MAPBOX_TOKEN = ''; // We'll handle this securely later

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [-74.5, 40],
        zoom: 9,
      });

      map.current.on('load', () => {
        setMapLoaded(true);
        toast({
          title: "Map loaded successfully",
          description: "Start exploring events in your area",
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: "Please check your connection and try again",
      });
    }

    return () => {
      map.current?.remove();
    };
  }, []);

  return (
    <div className="relative w-full h-screen">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 glass rounded-t-3xl p-6 slide-up transform transition-transform duration-300">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-4">Nearby Events</h2>
        <div className="space-y-4">
          {/* Event cards will go here */}
        </div>
      </div>
    </div>
  );
};

export default EventMap;
