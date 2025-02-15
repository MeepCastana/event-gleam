
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/components/ui/use-toast";
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';
import { useMapInitialization } from './map/useMapInitialization';
import { useHeatmap } from './map/useHeatmap';
import { HeatspotInfo } from '@/types/map';

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const lastLocation = useRef<{ latitude: number | null; longitude: number | null }>({ latitude: null, longitude: null });
  const [isDarkMap, setIsDarkMap] = useState(() => {
    const savedTheme = localStorage.getItem('mapTheme');
    return savedTheme === 'dark';
  });
  const { toast } = useToast();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const userId = useAnonymousId();
  const [selectedHeatspot, setSelectedHeatspot] = useState<HeatspotInfo | undefined>();

  // Enable location updates
  useLocationUpdates({ userId, enabled: mapLoaded });

  const centerOnLocation = () => {
    if (!locationControlRef.current || !map.current) return;

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Your browser does not support location services."
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Prevent re-centering if user hasn't moved
        if (
          lastLocation.current.latitude === latitude &&
          lastLocation.current.longitude === longitude
        ) {
          console.log("Location unchanged. Skipping re-center.");
          return;
        }

        console.log("User Location Updated:", latitude, longitude);

        lastLocation.current = { latitude, longitude }; // Store last location

        map.current?.flyTo({
          center: [longitude, latitude], // Correct Mapbox order
          zoom: 14,
          duration: 1000,
          essential: true
        });
      },
      (error) => {
        console.error("Location Error:", error.code, error.message);
        toast({
          variant: "destructive",
          title: "Location Error",
          description: `Error Code ${error.code}: ${error.message}`
        });
      },
      {
        enableHighAccuracy: true, // Use precise GPS
        timeout: 10000, // 10 sec timeout
        maximumAge: 5000 // Only refresh if the location is older than 5 seconds
      }
    );
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMap;
    setIsDarkMap(newTheme);
    localStorage.setItem('mapTheme', newTheme ? 'dark' : 'light');
    
    if (map.current) {
      map.current.once('style.load', () => {
        console.log('Style loaded, updating heatmap...');
        updateHeatmap();
      });
      
      map.current.setStyle(newTheme 
        ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
        : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
      );
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
    setSelectedHeatspot(undefined);
  };

  const { updateHeatmap } = useHeatmap(map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded);

  useMapInitialization({
    mapContainer,
    map,
    locationControlRef,
    isDarkMap,
    setMapLoaded,
    updateHeatmap
  });

  // Setup location tracking
  useLocationTracking({
    map: map.current,
    mapLoaded
  });

  // Call updateHeatmap when map is loaded and periodically
  useEffect(() => {
    if (mapLoaded) {
      console.log('Map loaded, updating heatmap...');
      updateHeatmap();
      
      const interval = setInterval(updateHeatmap, 30000);
      return () => clearInterval(interval);
    }
  }, [mapLoaded, updateHeatmap]);

  return (
    <div className="relative w-full h-screen">
      <MapHeader 
        menuStyle={isDarkMap ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} 
        isDarkMode={isDarkMap}
        onThemeToggle={toggleTheme}
        onLocationClick={centerOnLocation}
      />
      <div ref={mapContainer} className="absolute inset-0" />
      <EventsDrawer 
        menuStyle={isDarkMap ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'}
        isDrawerExpanded={isDrawerExpanded}
        onClose={handleDrawerClose}
        isDarkMode={isDarkMap}
        heatspotInfo={selectedHeatspot}
      />
    </div>
  );
};

export default EventMap;
