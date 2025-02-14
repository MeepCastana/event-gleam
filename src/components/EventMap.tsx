
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

interface CityInfo {
  lat: number;
  lng: number;
  weight: number;
  name: string;
}

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

  // Add new state for selected heatspot
  const [selectedHeatspot, setSelectedHeatspot] = useState<{
    cityName: string;
    coordinates: [number, number];
    intensity: number;
  } | undefined>();

  const updateHeatmap = async () => {
    if (!map.current || !mapLoaded) return;

    try {
      console.log('Updating heatmap...');
      // Get real data from Supabase
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Major cities around the world with their coordinates
      const cities: CityInfo[] = [
        // Romanian cities with population-based weights
        { lat: 44.4268, lng: 26.1025, weight: 2.0, name: "Bucharest" },
        { lat: 45.7489, lng: 21.2087, weight: 1.5, name: "Timișoara" },
        { lat: 46.7712, lng: 23.6236, weight: 1.5, name: "Cluj-Napoca" },
        { lat: 47.1585, lng: 27.6014, weight: 1.5, name: "Iași" },
        { lat: 44.3178, lng: 23.7945, weight: 1.4, name: "Craiova" },
        { lat: 45.6427, lng: 25.5887, weight: 1.3, name: "Brașov" },
        { lat: 44.4323, lng: 26.1063, weight: 1.3, name: "Sector 2" },
        { lat: 47.6458, lng: 26.2499, weight: 1.2, name: "Suceava" },
        { lat: 45.4371, lng: 28.0500, weight: 1.2, name: "Galați" },
        { lat: 44.4268, lng: 26.1025, weight: 1.2, name: "Sector 3" },
        { lat: 45.2652, lng: 27.9750, weight: 1.1, name: "Brăila" },
        { lat: 46.5455, lng: 24.5627, weight: 1.1, name: "Târgu Mureș" },
        { lat: 45.7489, lng: 21.2087, weight: 1.1, name: "Baia Mare" },
        { lat: 44.9371, lng: 26.0300, weight: 1.0, name: "Ploiești" },
        { lat: 47.7484, lng: 22.8784, weight: 1.0, name: "Satu Mare" },
        { lat: 46.0177, lng: 23.5804, weight: 1.0, name: "Alba Iulia" },
        { lat: 45.8667, lng: 22.9167, weight: 1.0, name: "Deva" },
        { lat: 44.1733, lng: 28.6383, weight: 1.4, name: "Constanța" },

        // European cities
        { lat: 51.5074, lng: -0.1278, weight: 1.8, name: "London" },
        { lat: 48.8566, lng: 2.3522, weight: 1.7, name: "Paris" },
        { lat: 52.5200, lng: 13.4050, weight: 1.6, name: "Berlin" },
        { lat: 41.9028, lng: 12.4964, weight: 1.5, name: "Rome" },
        { lat: 52.3676, lng: 4.9041, weight: 1.4, name: "Amsterdam" },
        { lat: 48.2082, lng: 16.3738, weight: 1.3, name: "Vienna" },
        { lat: 40.4168, lng: -3.7038, weight: 1.6, name: "Madrid" },
        { lat: 59.9139, lng: 10.7522, weight: 1.2, name: "Oslo" },

        // US cities
        { lat: 40.7128, lng: -74.0060, weight: 1.9, name: "New York" },
        { lat: 34.0522, lng: -118.2437, weight: 1.8, name: "Los Angeles" },
        { lat: 41.8781, lng: -87.6298, weight: 1.7, name: "Chicago" },
        { lat: 29.7604, lng: -95.3698, weight: 1.6, name: "Houston" },
        { lat: 39.9526, lng: -75.1652, weight: 1.5, name: "Philadelphia" },
        { lat: 37.7749, lng: -122.4194, weight: 1.6, name: "San Francisco" },
      ];

      // Generate cluster points around each city
      const testPoints = cities.flatMap(city => {
        const points = [];
        // Reduced number of points per city (10 * weight instead of 30)
        const numPoints = Math.floor(city.weight * 10);
        for (let i = 0; i < numPoints; i++) {
          // Smaller radius for more concentrated clusters
          const radiusFactor = city.weight > 1 ? 0.015 : 0.025; // Half the previous values
          const latOffset = (Math.random() - 0.5) * radiusFactor;
          const lngOffset = (Math.random() - 0.5) * radiusFactor;
          
          // Vary the weights more significantly
          const randomWeight = city.weight * (0.3 + Math.random() * 0.7); // More variation in weight
          
          points.push({
            type: "Feature" as const,
            properties: {
              weight: randomWeight
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

      console.log('Generated points:', points.length);

      if (map.current.getSource('heatmap-source')) {
        console.log('Updating existing source');
        const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: points
        });
      } else if (mapLoaded) {
        console.log('Adding new source and layer');
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
            // More gradual weight distribution
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight', ['properties']],
              0, 0.3,
              2, 1.5
            ],
            // Reduced intensity
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              9, 3
            ],
            // More varied color palette
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(150,150,255,0.4)',  // Light blue
              0.4, 'rgba(0,255,0,0.5)',      // Green
              0.6, 'rgba(255,255,0,0.6)',    // Yellow
              0.8, 'rgba(255,150,0,0.7)',    // Orange
              1, 'rgba(255,0,0,0.8)'         // Red
            ],
            // Smaller radius
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 10,
              9, 25
            ],
            // Slightly reduced opacity
            'heatmap-opacity': 0.8
          }
        });
      }

      if (map.current && mapLoaded) {
        let isClickingHeatspot = false;

        // Add click event handler for the heatmap layer first
        map.current.on('click', 'heatmap-layer', (e) => {
          if (!e.features?.[0]) return;

          // Set flag to prevent map click handler from running
          isClickingHeatspot = true;

          const coords = e.features[0].geometry.type === 'Point' 
            ? e.features[0].geometry.coordinates as [number, number]
            : undefined;

          if (coords) {
            // Center the map on the clicked point with animation
            map.current?.flyTo({
              center: [coords[0], coords[1]],
              zoom: 12,
              duration: 1500,
              essential: true
            });

            // Find the nearest city to the clicked point
            const nearestCity = cities.reduce((nearest, city) => {
              const distance = Math.sqrt(
                Math.pow(city.lng - coords[0], 2) + 
                Math.pow(city.lat - coords[1], 2)
              );
              return distance < nearest.distance ? { city, distance } : nearest;
            }, { city: cities[0], distance: Infinity }).city;

            setSelectedHeatspot({
              cityName: nearestCity.name,
              coordinates: coords,
              intensity: nearestCity.weight
            });
            
            // Force drawer to expand fully
            setIsDrawerExpanded(true);
          }
        });

        // Add click event handler for the map after the heatmap layer handler
        map.current.on('click', (e) => {
          // Only run if we're not clicking on a heatspot
          if (!isClickingHeatspot) {
            setSelectedHeatspot(undefined);
            setIsDrawerExpanded(false);
          }
          // Reset the flag for the next click
          isClickingHeatspot = false;
        });

        // Change cursor to pointer when hovering over heatmap
        map.current.on('mouseenter', 'heatmap-layer', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = 'pointer';
          }
        });

        map.current.on('mouseleave', 'heatmap-layer', () => {
          if (map.current) {
            map.current.getCanvas().style.cursor = '';
          }
        });
      }

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  };

  const centerOnLocation = async () => {
    if (!map.current) return;

    try {
      // First check if we have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
      console.log('Location permission state:', permission.state);
      
      if (permission.state === 'denied') {
        toast({
          title: "Location Access Required",
          description: "Please enable location access in your browser settings.",
          variant: "destructive"
        });
        return;
      }

      // Even if permission is prompt or granted, we need to explicitly request the position
      if (permission.state === 'prompt' || permission.state === 'granted') {
        // Show loading toast
        toast({
          title: "Getting Location",
          description: "Please wait while we locate you...",
        });

        // Get current position with a longer timeout
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              console.log('Position acquired:', pos.coords);
              resolve(pos);
            },
            (err) => {
              console.error('Geolocation error:', err);
              reject(err);
            },
            {
              enableHighAccuracy: true,
              timeout: 20000, // Increased timeout to 20 seconds
              maximumAge: 0
            }
          );
        });

        console.log('Flying to position:', [position.coords.longitude, position.coords.latitude]);
        
        // If we get here, we have a valid position
        map.current.flyTo({
          center: [position.coords.longitude, position.coords.latitude],
          zoom: 14,
          essential: true
        });

        toast({
          title: "Location Found",
          description: "Map centered on your location.",
        });
      }

    } catch (error) {
      console.error('Error in centerOnLocation:', error);
      
      // Provide more specific error messages based on the error type
      let errorMessage = "Unable to get your current location. Please ensure location services are enabled.";
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission was denied. Please enable location access in your browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable. Please try again.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out. Please check your connection and try again.";
            break;
        }
      }
      
      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive"
      });
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

      // Re-add heatmap layer when style is loaded
      map.current.once('style.load', () => {
        console.log('Style loaded, re-adding heatmap...');
        updateHeatmap();
      });
    }
  };

  const handleDrawerClose = () => {
    setIsDrawerExpanded(false);
    setSelectedHeatspot(undefined);
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

  // Call updateHeatmap when map is loaded and periodically
  useEffect(() => {
    if (mapLoaded) {
      console.log('Map loaded, updating heatmap...');
      updateHeatmap();
      
      // Set up periodic updates
      const interval = setInterval(updateHeatmap, 30000);
      
      return () => clearInterval(interval);
    }
  }, [mapLoaded]);

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
