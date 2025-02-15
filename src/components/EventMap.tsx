
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
    if (!mapLoaded) {
      toast({
        variant: "destructive",
        title: "Map Not Ready",
        description: "Please wait for the map to fully load."
      });
      return;
    }

    if (!map.current) {
      toast({
        variant: "destructive",
        title: "Map Error",
        description: "Map instance not found. Please refresh the page."
      });
      return;
    }

    if (!navigator.geolocation) {
      toast({
        variant: "destructive",
        title: "Location Not Supported",
        description: "Your browser does not support location services."
      });
      return;
    }

    // Show loading toast
    toast({
      title: "Getting Location",
      description: "Please wait while we locate you..."
    });

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "denied") {
        toast({
          variant: "destructive",
          title: "Location Blocked",
          description: "You have blocked location access. Enable it in your browser settings."
        });
        return;
      }
    });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("User Location:", latitude, longitude);

        if (map.current) {
          map.current.flyTo({
            center: [longitude, latitude], // Mapbox uses [lng, lat] format
            zoom: 14,
            duration: 1000,
            essential: true
          });
          
          // Success toast
          toast({
            title: "Location Found",
            description: "Centering map on your location.",
          });
        }
      },
      (error) => {
        console.error("Location Error:", error.code, error.message);
        let errorMessage = "Unable to get your location.";
        
        switch(error.code) {
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please try again.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please check your browser settings.";
            break;
        }
        
        toast({
          variant: "destructive",
          title: "Location Error",
          description: errorMessage
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 30000, // Increased timeout to 30 seconds
        maximumAge: 0
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
