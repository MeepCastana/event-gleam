
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapboxToken, setMapboxToken] = useState('');
  const [isTokenSet, setIsTokenSet] = useState(false);

  const initializeMap = () => {
    if (!mapContainer.current || map.current || !mapboxToken) return;

    try {
      mapboxgl.accessToken = mapboxToken;
      
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
        description: "Please check your Mapbox token and try again",
      });
    }
  };

  useEffect(() => {
    return () => {
      map.current?.remove();
    };
  }, []);

  const handleSetToken = () => {
    if (!mapboxToken) {
      toast({
        variant: "destructive",
        title: "Token Required",
        description: "Please enter your Mapbox token",
      });
      return;
    }

    setIsTokenSet(true);
    initializeMap();
  };

  if (!isTokenSet) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 space-y-4 max-w-md mx-auto">
        <h2 className="text-xl font-semibold text-center">Enter your Mapbox Token</h2>
        <p className="text-sm text-muted-foreground text-center">
          To use the map, please enter your Mapbox public token. You can find this in your Mapbox account dashboard.
        </p>
        <Input
          type="text"
          placeholder="pk.eyJ1..."
          value={mapboxToken}
          onChange={(e) => setMapboxToken(e.target.value)}
          className="w-full"
        />
        <Button onClick={handleSetToken} className="w-full">
          Set Token
        </Button>
      </div>
    );
  }

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
