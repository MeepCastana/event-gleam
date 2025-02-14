
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
import type { Feature, Point } from 'geojson';
import type { MapLayerMouseEvent } from 'mapbox-gl';

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

  // First, initialize the theme hook since other hooks depend on isDarkMap
  const { isDarkMap, toggleTheme } = useMapTheme();
  
  // Then use isDarkMap in other hooks
  const { mapContainer, map, locationControlRef } = useMapInitialization({
    isDarkMap,
    onMapLoaded: () => {
      setMapLoaded(true);
      updateHeatmap();
    }
  });

  const { updateHeatmap } = useHeatmap(map, mapLoaded);
  const { centerOnLocation } = useMapControls(map, locationControlRef);

  // Enable location updates
  useLocationUpdates({ userId, enabled: mapLoaded });

  // Setup location tracking
  useLocationTracking({
    map: map.current,
    mapLoaded
  });

  // Set up periodic heatmap updates and click handling
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    console.log('Map loaded, updating heatmap...');
    updateHeatmap();
    
    const interval = setInterval(updateHeatmap, 30000);

    // Define click handler function
    const handleHeatmapClick = (e: MapLayerMouseEvent) => {
      if (!e.features?.[0]) return;

      const feature = e.features[0] as Feature<Point>;
      if (!feature.geometry.coordinates) return;

      const coordinates = feature.geometry.coordinates.slice() as [number, number];
      const intensity = feature.properties?.weight || 0;

      // Find the closest city
      const cities = [
        { name: "Bucharest", coords: [26.1025, 44.4268] },
        { name: "Timișoara", coords: [21.2087, 45.7489] },
        { name: "Cluj-Napoca", coords: [23.6236, 46.7712] },
        // ... add other cities as needed
      ];

      let closestCity = cities[0];
      let minDistance = Infinity;

      cities.forEach(city => {
        const dist = Math.sqrt(
          Math.pow(coordinates[0] - city.coords[0], 2) + 
          Math.pow(coordinates[1] - city.coords[1], 2)
        );
        if (dist < minDistance) {
          minDistance = dist;
          closestCity = city;
        }
      });

      setSelectedHeatspot({
        cityName: closestCity.name,
        coordinates,
        intensity
      });

      map.current?.flyTo({
        center: coordinates,
        zoom: 14,
        essential: true
      });

      setIsDrawerExpanded(true);
    };

    // Add click handler for heatmap layer
    map.current.on('click', 'heatmap-layer', handleHeatmapClick);

    // Hide the geolocate control
    const hideGeolocateControl = () => {
      const geolocateControl = document.querySelector('.mapboxgl-ctrl-geolocate');
      if (geolocateControl) {
        (geolocateControl as HTMLElement).style.display = 'none';
      }
    };

    // Initial hide
    hideGeolocateControl();

    // Hide after any style changes
    map.current.on('style.load', () => hideGeolocateControl());

    return () => {
      clearInterval(interval);
      if (map.current) {
        map.current.off('click', 'heatmap-layer', handleHeatmapClick);
        map.current.off('style.load', hideGeolocateControl);
      }
    };
  }, [mapLoaded, map, updateHeatmap]);

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
