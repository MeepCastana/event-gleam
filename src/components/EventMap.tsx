
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { PointsOfInterest } from './map/PointsOfInterest';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';
import { useMapInitialization } from './map/useMapInitialization';
import { useHeatmap } from './map/useHeatmap';
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

  useEffect(() => {
    if (mapContainer.current && !map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [25.6, 45.9], // Center on Romania
        zoom: 6.5 // Show most of Romania
      });

      map.current.on('load', () => {
        setMapLoaded(true);
      });
    }
  }, []);

  const { updateHeatmap } = useHeatmap(map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded, isVisibleOnHeatmap);
  const { isDarkMap, toggleTheme } = useMapTheme({ map, updateHeatmap });

  const { startTracking, stopTracking, isTracking } = useLocationTracking(userId);
  const { initializeLocationUpdates } = useLocationUpdates({ userId, enabled: mapLoaded });

  useEffect(() => {
    if (mapLoaded) {
      initializeLocationUpdates();
    }
  }, [mapLoaded, initializeLocationUpdates]);

  useEffect(() => {
    if (mapLoaded && !autoStartAttempted.current) {
      autoStartAttempted.current = true;
      startTracking();
    }
  }, [mapLoaded, startTracking]);

  const handleVisibilityToggle = () => {
    setIsVisibleOnHeatmap(!isVisibleOnHeatmap);
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
  };

  return (
    <div className="relative w-full h-screen">
      <MapHeader 
        menuStyle={isDarkMap ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'} 
        isDarkMode={isDarkMap}
        onThemeToggle={toggleTheme}
        onLocationClick={() => {}}
        isTracking={isVisibleOnHeatmap}
        onTrackingToggle={handleVisibilityToggle}
      />
      <div ref={mapContainer} className="absolute inset-0" />
      <PointsOfInterest map={map.current} mapLoaded={mapLoaded} />
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
