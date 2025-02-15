
import { useCallback, MutableRefObject, useEffect } from 'react';
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

interface TestHeatspot {
  latitude: number;
  longitude: number;
  weight: number;
  name: string;
}

export const useHeatmap = (
  map: MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  setSelectedHeatspot: (heatspot: HeatspotInfo | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void,
  isVisibleOnHeatmap: boolean = true,
  showRandomPoints: boolean = true
) => {
  // Effect to handle test points visibility
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    const source = map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource;
    if (source) {
      // Trigger an update to refresh the points
      updateHeatmap();
    }
  }, [showRandomPoints, mapLoaded]);

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

      // Fetch test heatspots if showRandomPoints is true
      let testPoints: any[] = [];
      if (showRandomPoints) {
        const { data: testHeatspots, error: testError } = await supabase
          .from('test_heatspots')
          .select('latitude, longitude, weight, name')
          .eq('type', 'test');

        if (testError) {
          console.error('Error fetching test heatspots:', testError);
        } else if (testHeatspots) {
          console.log('Fetched test heatspots:', testHeatspots.length);
          testPoints = testHeatspots.map(spot => ({
            type: "Feature" as const,
            properties: {
              weight: spot.weight,
              name: spot.name
            },
            geometry: {
              type: "Point" as const,
              coordinates: [
                spot.longitude,
                spot.latitude
              ]
            }
          }));
        }
      }
      
      // Calculate dynamic radius based on user count
      const heatmapRadius = calculateHeatmapRadius(userPoints);

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
        console.log('Updating existing source with points:', points.length);
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
              0, 0.05,
              0.2, 0.2,
              1.5, 1
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.4,
              9, 1.5
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(0,0,0,0)',  // Keep base transparent
              0.1, 'rgb(150,150,255)',  // Bright blue
              0.3, 'rgb(100,255,100)',  // Bright green
              0.5, 'rgb(255,255,0)',    // Bright yellow
              0.7, 'rgb(255,150,0)',    // Bright orange
              1, 'rgb(255,0,0)'         // Bright red
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, heatmapRadius * 1.5,
              9, heatmapRadius * 3
            ],
            'heatmap-opacity': 1
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
