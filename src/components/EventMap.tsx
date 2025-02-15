
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
import { useMapTheme } from '@/hooks/useMapTheme';
import { HeatspotInfo } from '@/types/map';
import { useBusinesses } from '@/hooks/useBusinesses';
import { BusinessMarker } from './map/BusinessMarker';
import { BusinessDrawer } from './business/BusinessDrawer';
import { Business } from '@/types/business';
import { useMapMarker } from '@/hooks/useMapMarker';

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const locationControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const businessMarkersRef = useRef<BusinessMarker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [isDrawerExpanded, setIsDrawerExpanded] = useState(false);
  const userId = useAnonymousId();
  const [selectedHeatspot, setSelectedHeatspot] = useState<HeatspotInfo | undefined>();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isVisibleOnHeatmap, setIsVisibleOnHeatmap] = useState(true);
  const autoStartAttempted = useRef(false);

  const { updateHeatmap } = useHeatmap(map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded, isVisibleOnHeatmap);
  const { isDarkMap, toggleTheme } = useMapTheme({ map, updateHeatmap });
  const { data: businesses } = useBusinesses();
  const { updateMarkerPosition } = useMapMarker(map.current, mapLoaded);

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

  // Handle search location selection
  const handleLocationSelect = (longitude: number, latitude: number) => {
    if (!mapLoaded || !map.current) return;
    
    // Only update marker position if coordinates are provided (not a reset)
    if (longitude !== 0 && latitude !== 0) {
      updateMarkerPosition(longitude, latitude);
    } else {
      // If it's a reset (0,0), make sure to clean up the marker
      if (map.current.getLayer('search-location')) {
        map.current.removeLayer('search-location');
      }
      if (map.current.getSource('search-location')) {
        map.current.removeSource('search-location');
      }
    }
  };

  // Update business markers when businesses data changes
  useEffect(() => {
    if (!map.current || !businesses) return;

    // Remove existing markers
    businessMarkersRef.current.forEach(marker => marker.remove());
    businessMarkersRef.current = [];

    // Add new markers
    businesses.forEach(business => {
      const marker = new BusinessMarker(business, () => {
        setSelectedBusiness(business);
      });
      marker.addTo(map.current!);
      businessMarkersRef.current.push(marker);
    });

    return () => {
      businessMarkersRef.current.forEach(marker => marker.remove());
      businessMarkersRef.current = [];
    };
  }, [businesses, map.current]);

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
        onLocationClick={handleLocationSelect}
        isTracking={isVisibleOnHeatmap}
        onTrackingToggle={handleVisibilityToggle}
        map={map}
      />
      <div ref={mapContainer} className="absolute inset-0" />
      <EventsDrawer 
        menuStyle={isDarkMap ? 'bg-zinc-700/90 text-zinc-100' : 'bg-zinc-900/95 text-zinc-100'}
        isDrawerExpanded={isDrawerExpanded}
        onClose={handleDrawerClose}
        isDarkMode={isDarkMap}
        heatspotInfo={selectedHeatspot}
      />
      <BusinessDrawer 
        business={selectedBusiness} 
        onClose={() => setSelectedBusiness(null)} 
      />
    </div>
  );
};

export default EventMap;
