
import { useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";
import { HeatspotInfo } from '@/types/map';
import { cities } from './heatmap/citiesData';
import { useHeatmapInteractions } from './heatmap/useHeatmapInteractions';
import { calculateHeatmapWeight, calculateHeatmapRadius } from '@/utils/heatmapUtils';

interface UserLocation {
  latitude: number;
  longitude: number;
  user_id: string;
}

export const useHeatmap = (
  map: MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  setSelectedHeatspot: (heatspot: HeatspotInfo | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void,
  isVisibleOnHeatmap: boolean = true,
  showRandomPoints: boolean = true
) => {
  const updateHeatmap = useCallback(async () => {
    if (!map.current || !mapLoaded) return;

    try {
      console.log('Updating heatmap...');
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude, user_id')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Process user locations
      const userPoints = isVisibleOnHeatmap ? (locations?.map(loc => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        userId: loc.user_id,
        weight: 0.2 // Lower initial weight for single users
      })) || []) : [];

      // Calculate weights based on proximity
      const weightedUserPoints = calculateHeatmapWeight(userPoints);
      
      // Calculate dynamic radius based on user count
      const heatmapRadius = calculateHeatmapRadius(userPoints);

      // Only include random test points if showRandomPoints is true
      const testPoints = showRandomPoints ? cities.flatMap(city => {
        const points = [];
        const numPoints = Math.floor(city.weight * 15); // Increased from 10 to 15 for more points
        for (let i = 0; i < numPoints; i++) {
          const radiusFactor = city.weight > 1 ? 0.025 : 0.035; // Increased spread
          const latOffset = (Math.random() - 0.5) * radiusFactor;
          const lngOffset = (Math.random() - 0.5) * radiusFactor;
          
          points.push({
            type: "Feature" as const,
            properties: {
              weight: city.weight * (0.4 + Math.random() * 0.8) // Increased weight range
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
      }) : [];

      // Convert weighted user points to GeoJSON
      const userGeoPoints = weightedUserPoints.map(point => ({
        type: "Feature" as const,
        properties: {
          weight: point.weight
        },
        geometry: {
          type: "Point" as const,
          coordinates: [point.longitude, point.latitude]
        }
      }));

      const points = [
        ...userGeoPoints,
        ...testPoints
      ];

      if (map.current.getSource('heatmap-source')) {
        console.log('Updating existing source');
        const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;
        source.setData({
          type: "FeatureCollection",
          features: points
        });

        // Update heatmap radius
        map.current.setPaintProperty('heatmap-layer', 'heatmap-radius', [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, heatmapRadius,
          9, heatmapRadius * 2
        ]);
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
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight', ['properties']],
              0, 0.05,  // Even lower minimum weight
              0.2, 0.2, // Single user weight
              1.5, 1    // Multiple users maximum
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.4,   // Further reduced base intensity
              9, 1.5    // Lower maximum intensity
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.1, 'rgba(150,150,255,0.05)',  // Very light blue, more transparent
              0.3, 'rgba(100,255,100,0.1)',   // Very light green, more transparent
              0.5, 'rgba(255,255,0,0.15)',    // Very light yellow, more transparent
              0.7, 'rgba(255,150,0,0.2)',     // Light orange, more transparent
              1, 'rgba(255,0,0,0.25)'         // Light red, more transparent
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, heatmapRadius * 1.5, // Increased base radius
              9, heatmapRadius * 3    // Increased maximum radius
            ],
            'heatmap-opacity': 1  // Increased to full opacity since individual colors are more transparent
          }
        });
      }

      if (map.current && mapLoaded) {
        useHeatmapInteractions(map.current, cities, setSelectedHeatspot, setIsDrawerExpanded);
      }

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  }, [map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded, isVisibleOnHeatmap, showRandomPoints]);

  return { updateHeatmap, cities };
};
