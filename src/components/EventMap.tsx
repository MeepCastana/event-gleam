import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MapHeader } from './map/MapHeader';
import { EventsDrawer } from './map/EventsDrawer';
import { useLocationTracking } from '@/hooks/useLocationTracking';
import { useAnonymousId } from '@/hooks/useAnonymousId';
import { useLocationUpdates } from '@/hooks/useLocationUpdates';

const EventMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
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

  // Enable location updates
  useLocationUpdates({ userId, enabled: mapLoaded });

  const updateHeatmap = async () => {
    if (!map.current || !mapLoaded) return;

    try {
      // Get real data from Supabase
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Major cities around the world with their coordinates
      const cities = [
        // Europe
        { lat: 51.5074, lng: -0.1278, weight: 1 }, // London
        { lat: 48.8566, lng: 2.3522, weight: 1 }, // Paris
        { lat: 52.5200, lng: 13.4050, weight: 1 }, // Berlin
        { lat: 41.9028, lng: 12.4964, weight: 1 }, // Rome
        { lat: 40.4168, lng: -3.7038, weight: 1 }, // Madrid
        { lat: 59.9139, lng: 10.7522, weight: 1 }, // Oslo
        { lat: 55.7558, lng: 37.6173, weight: 1 }, // Moscow
        
        // Asia
        { lat: 35.6762, lng: 139.6503, weight: 1 }, // Tokyo
        { lat: 31.2304, lng: 121.4737, weight: 1 }, // Shanghai
        { lat: 22.3193, lng: 114.1694, weight: 1 }, // Hong Kong
        { lat: 1.3521, lng: 103.8198, weight: 1 }, // Singapore
        { lat: 28.6139, lng: 77.2090, weight: 1 }, // New Delhi
        { lat: 25.2048, lng: 55.2708, weight: 1 }, // Dubai
        
        // Africa
        { lat: -33.9249, lng: 18.4241, weight: 1 }, // Cape Town
        { lat: 30.0444, lng: 31.2357, weight: 1 }, // Cairo
        { lat: 6.5244, lng: 3.3792, weight: 1 }, // Lagos
        { lat: -1.2921, lng: 36.8219, weight: 1 }, // Nairobi
        
        // Australia
        { lat: -33.8688, lng: 151.2093, weight: 1 }, // Sydney
        { lat: -37.8136, lng: 144.9631, weight: 1 }, // Melbourne
        { lat: -31.9505, lng: 115.8605, weight: 1 }, // Perth
        
        // USA
        { lat: 40.7128, lng: -74.0060, weight: 1 }, // New York
        { lat: 34.0522, lng: -118.2437, weight: 1 }, // Los Angeles
        { lat: 41.8781, lng: -87.6298, weight: 1 }, // Chicago
        { lat: 29.7604, lng: -95.3698, weight: 1 }, // Houston
        { lat: 37.7749, lng: -122.4194, weight: 1 }, // San Francisco
        { lat: 25.7617, lng: -80.1918, weight: 1 } // Miami
      ];

      // Generate cluster points around each city
      const testPoints = cities.flatMap(city => {
        const points = [];
        // Generate 20 points around each city
        for (let i = 0; i < 20; i++) {
          // Random offset within ~5km
          const latOffset = (Math.random() - 0.5) * 0.05;
          const lngOffset = (Math.random() - 0.5) * 0.05;
          points.push({
            type: "Feature" as const,
            properties: {
              weight: city.weight * (0.5 + Math.random() * 0.5) // Vary the weight
            },
            geometry: {
              type: "Point" as const,
              coordinates: [
                city.lng + lngOffset,
                city.lat + latOffset
              ]
            }
          });
        }
        return points;
      });

      // Combine real and test data
      const points = [
        ...(locations?.map(loc => ({
          type: "Feature" as const,
          properties: {
            weight: 1
          },
          geometry: {
            type: "Point" as const,
            coordinates: [loc.longitude, loc.latitude]
          }
        })) || []),
        ...testPoints
      ];

      const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;

      if (source) {
        source.setData({
          type: "FeatureCollection",
          features: points
        });
      } else if (mapLoaded) {
        map.current.addSource('heatmap-source', {
          type: 'geojson',
          data: {
            type: "FeatureCollection",
            features: points
          }
        });

        map.current.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight', ['properties']],
              0, 0.6,
              1, 1
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              9, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 4,
              9, 30
            ],
            'heatmap-opacity': 0.8
          }
        });
      }
    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMap;
    setIsDarkMap(newTheme);
    localStorage.setItem('mapTheme', newTheme ? 'dark' : 'light');
    
    if (map.current) {
      map.current.setStyle(
        newTheme
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
      );
    }
  };

  const centerOnLocation = async () => {
    if (!locationControlRef.current) return;

    try {
      // First check if we have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      
      if (permission.state === 'denied') {
        toast({
          title: "Location Access Required",
          description: "Please enable location access in your browser settings.",
          variant: "destructive"
        });
        return;
      }

      // Get current position manually first
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (map.current && locationControlRef.current) {
            map.current.flyTo({
              center: [position.coords.longitude, position.coords.latitude],
              zoom: 15,
              essential: true
            });
            locationControlRef.current.trigger(); // Trigger the control after centering
          }
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: "Location Error",
            description: "Unable to get your current location.",
            variant: "destructive"
          });
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    } catch (error) {
      console.error('Error accessing location:', error);
      toast({
        title: "Location Error",
        description: "Unable to access location services.",
        variant: "destructive"
      });
    }
  };

  const initializeMap = async () => {
    if (!mapContainer.current || map.current) return;
    try {
      // Get initial location before initializing map
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });

      const { data: config, error } = await supabase
        .from('_config')
        .select('value')
        .eq('name', 'MAPBOX_TOKEN')
        .maybeSingle();

      if (error) throw error;
      if (!config) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Mapbox token not found in configuration. Please make sure it's set in Supabase."
        });
        return;
      }

      const mapboxToken = config.value;
      if (!mapboxToken) {
        toast({
          variant: "destructive",
          title: "Configuration Error",
          description: "Invalid Mapbox token configuration"
        });
        return;
      }

      mapboxgl.accessToken = mapboxToken;
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: isDarkMap 
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims',
        center: [position.coords.longitude, position.coords.latitude],
        zoom: 14
      });

      // Initialize GeolocateControl and add it to the map
      locationControlRef.current = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showAccuracyCircle: false,
        showUserLocation: true
      });

      // Add the control to the map
      map.current.addControl(locationControlRef.current);

      // Hide the default control UI since we're using our custom button
      setTimeout(() => {
        const geolocateControl = document.querySelector('.mapboxgl-ctrl-geolocate');
        if (geolocateControl) {
          (geolocateControl as HTMLElement).style.display = 'none';
        }
      }, 100);

      map.current.on('style.load', () => {
        setMapLoaded(true);
        updateHeatmap();
      });

      // Set up periodic heatmap updates
      const updateInterval = setInterval(updateHeatmap, 30000);

      return () => {
        clearInterval(updateInterval);
        map.current?.remove();
      };
    } catch (error) {
      console.error('Error initializing map:', error);
      toast({
        variant: "destructive",
        title: "Error loading map",
        description: "Please check the Mapbox configuration and try again"
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
  };

  // Initialize map
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    const setupMap = async () => {
      cleanup = await initializeMap();
    };
    setupMap();
    return () => {
      cleanup?.();
      map.current?.remove();
    };
  }, []);

  // Setup location tracking
  useLocationTracking({
    map: map.current,
    mapLoaded
  });

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
      />
    </div>
  );
};

export default EventMap;
