
import { useState, useEffect } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useMapTheme } from '@/hooks/useMapTheme';
import { useMapControls } from '@/hooks/useMapControls';

interface HeatspotInfo {
  cityName: string;
  coordinates: [number, number];
  intensity: number;
}

const EventMap = () => {
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [selectedHeatspot, setSelectedHeatspot] = useState<HeatspotInfo>();
  const userId = useAnonymousId();

  const { mapContainer, map, locationControlRef } = useMapInitialization({
    isDarkMap: isDarkMap,
    onMapLoaded: () => {
      setMapLoaded(true);
      updateHeatmap();
    }
  });

  const { updateHeatmap } = useHeatmap(map, mapLoaded);
  const { isDarkMap, toggleTheme } = useMapTheme(map, updateHeatmap);
  const { centerOnLocation } = useMapControls(map, locationControlRef);

  // Enable location updates
  useLocationUpdates({ userId, enabled: mapLoaded });

  // Setup location tracking
  useLocationTracking({
    map: map.current,
    mapLoaded
  });

  // Set up periodic heatmap updates
  useEffect(() => {
    if (mapLoaded) {
      console.log('Map loaded, updating heatmap...');
      updateHeatmap();
      
      const interval = setInterval(updateHeatmap, 30000);
      return () => clearInterval(interval);
    }
  }, [mapLoaded, updateHeatmap]);

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
    setSelectedHeatspot(undefined);
  };

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
