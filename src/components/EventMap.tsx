
import { useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';
import { useHeatmap } from '@/hooks/useHeatmap';
import { useMapInitialization } from '@/hooks/useMapInitialization';
import { useLocationControl } from '@/hooks/useLocationControl';
import 'mapbox-gl/dist/mapbox-gl.css';

const EventMap = () => {
  const [isDarkMap, setIsDarkMap] = useState(() => {
    const savedTheme = localStorage.getItem('mapTheme');
    return savedTheme === 'dark';
  });
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const [selectedHeatspot, setSelectedHeatspot] = useState<{
    cityName: string;
    coordinates: [number, number];
    intensity: number;
  } | undefined>();

  const userId = useAnonymousId();
  const { mapContainer, map, locationControlRef } = useMapInitialization({
    isDarkMap,
    onMapLoad: () => setMapLoaded(true)
  });
  const { updateHeatmap } = useHeatmap({ map, mapLoaded });
  const { centerOnLocation } = useLocationControl({ map, locationControlRef });

  // Enable location updates
  useLocationUpdates({ userId, enabled: mapLoaded });

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
    setSelectedHeatspot(undefined);
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMap;
    setIsDarkMap(newTheme);
    localStorage.setItem('mapTheme', newTheme ? 'dark' : 'light');
    
    if (map.current) {
      const heatmapVisible = map.current.getLayoutProperty('heatmap-layer', 'visibility') === 'visible';
      
      map.current.setStyle(
        newTheme
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
      );

      map.current.once('style.load', () => {
        console.log('Style loaded, re-adding heatmap...');
        updateHeatmap().then(() => {
          if (map.current && map.current.getLayer('heatmap-layer')) {
            map.current.setLayoutProperty('heatmap-layer', 'visibility', heatmapVisible ? 'visible' : 'none');
          }
        });
      });
    }
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
