
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';
import { useMapInitialization } from './map/useMapInitialization';
import { useHeatmap } from './map/useHeatmap';
import { useMapLocation } from '@/hooks/useMapLocation';
import { useMapTheme } from '@/hooks/useMapTheme';
import { HeatspotInfo } from '@/types/map';

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const userId = useAnonymousId();
  const [selectedHeatspot, setSelectedHeatspot] = useState<HeatspotInfo | undefined>();
  const [isVisibleOnHeatmap, setIsVisibleOnHeatmap] = useState(true);
  const autoStartAttempted = useRef(false);

  const { updateHeatmap } = useHeatmap(map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded, isVisibleOnHeatmap);
  const { isDarkMap, toggleTheme } = useMapTheme({ map, updateHeatmap });
  const { centerOnLocation } = useMapLocation({ map, locationControlRef });

  // Enable location updates always, regardless of heatmap visibility
  useLocationUpdates({ userId, enabled: mapLoaded });

  useMapInitialization({
    mapContainer,
    map,
    locationControlRef,
    isDarkMap,
    setMapLoaded,
    updateHeatmap
  });

  // Setup location tracking with proper map instance
  const { isTracking, startTracking } = useLocationTracking({
    map: map.current,
    mapLoaded,
    userId
  });

  const handleVisibilityToggle = () => {
    setIsVisibleOnHeatmap(prev => !prev);
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
    setSelectedHeatspot(undefined);
  };

  // Single auto-start effect that only runs once when conditions are met
  useEffect(() => {
    if (mapLoaded && !isTracking && map.current && userId && !autoStartAttempted.current) {
      console.log('Attempting to auto-start location tracking...');
      autoStartAttempted.current = true;
      startTracking();
    }
  }, [mapLoaded, isTracking, userId]);

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
        isTracking={isVisibleOnHeatmap}
        onTrackingToggle={handleVisibilityToggle}
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
