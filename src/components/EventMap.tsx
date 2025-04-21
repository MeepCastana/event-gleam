
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
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent } from './ui/dialog';

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
  const [showRandomPoints, setShowRandomPoints] = useState(true);
  const autoStartAttempted = useRef(false);
  const [customToken, setCustomToken] = useState('');
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);

  const { updateHeatmap } = useHeatmap(
    map, 
    mapLoaded, 
    setSelectedHeatspot, 
    setIsDrawerExpanded, 
    isVisibleOnHeatmap,
    showRandomPoints
  );

  const { isDarkMap, toggleTheme } = useMapTheme({ map, updateHeatmap });
  const { data: businesses } = useBusinesses();
  const { updateMarkerPosition } = useMapMarker(map.current, mapLoaded);

  const { tokenInputVisible } = useMapInitialization({
    mapContainer,
    map,
    locationControlRef,
    isDarkMap,
    setMapLoaded,
    updateHeatmap
  });

  useLocationUpdates({ userId, enabled: mapLoaded });

  const { isTracking, startTracking } = useLocationTracking({
    map: map.current,
    mapLoaded,
    userId
  });

  useEffect(() => {
    if (tokenInputVisible) {
      setTokenDialogOpen(true);
    }
  }, [tokenInputVisible]);

  const handleTokenSubmit = () => {
    if (customToken.length > 0) {
      // Dispatch a custom event that our useEffect in the initialization hook will listen for
      window.dispatchEvent(
        new CustomEvent('mapbox-token-submit', { 
          detail: { token: customToken } 
        })
      );
      setTokenDialogOpen(false);
    }
  };

  const handleVisibilityToggle = () => {
    setIsVisibleOnHeatmap(prev => !prev);
  };

  const handleRandomPointsToggle = async (checked: boolean) => {
    console.log('Toggling random points:', checked);
    setShowRandomPoints(checked);
    // We need to wait for the state to update before updating the heatmap
    setTimeout(() => {
      console.log('Updating heatmap after toggle');
      updateHeatmap();
    }, 0);
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

  // Effect to update heatmap when showRandomPoints changes
  useEffect(() => {
    if (mapLoaded) {
      console.log('Random points state changed, updating heatmap...');
      updateHeatmap();
    }
  }, [showRandomPoints, mapLoaded, updateHeatmap]);

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
        showRandomPoints={showRandomPoints}
        onRandomPointsToggle={handleRandomPointsToggle}
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

      {/* Mapbox Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center space-y-4 py-2">
            <h2 className="text-xl font-semibold">Mapbox Token Required</h2>
            <p className="text-sm text-muted-foreground">
              Please enter your Mapbox access token to load the map. You can find this in your Mapbox account dashboard.
            </p>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Enter your Mapbox token..."
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                className="w-full"
              />
              <Button onClick={handleTokenSubmit} className="w-full">
                Load Map
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Your token will be saved in your browser for future use.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventMap;
