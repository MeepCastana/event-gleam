
import { useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";
import { HeatspotInfo } from '@/types/map';
import { cities } from './heatmap/citiesData';
import { useHeatmapInteractions } from './heatmap/useHeatmapInteractions';

export const useHeatmap = (
  map: MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  setSelectedHeatspot: (heatspot: HeatspotInfo | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void,
  isVisibleOnHeatmap: boolean = true
) => {
  const updateHeatmap = useCallback(async () => {
    if (!map.current || !mapLoaded) return;

    try {
      console.log('Updating heatmap...');
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const testPoints = cities.flatMap(city => {
        const points = [];
        const numPoints = Math.floor(city.weight * 10);
        for (let i = 0; i < numPoints; i++) {
          const radiusFactor = city.weight > 1 ? 0.015 : 0.025;
          const latOffset = (Math.random() - 0.5) * radiusFactor;
          const lngOffset = (Math.random() - 0.5) * radiusFactor;
          const randomWeight = city.weight * (0.3 + Math.random() * 0.7);
          
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

      // Only include user location if visibility is enabled
      const userPoints = isVisibleOnHeatmap ? (locations?.map(loc => ({
        type: "Feature" as const,
        properties: {
          weight: 1
        },
        geometry: {
          type: "Point" as const,
          coordinates: [loc.longitude, loc.latitude]
        }
      })) || []) : [];

      const points = [
        ...userPoints,
        ...testPoints
      ];

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
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'weight', ['properties']],
              0, 0.3,
              2, 1.5
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
              0, 'rgba(0,0,0,0)',
              0.2, 'rgba(150,150,255,0.4)',
              0.4, 'rgba(0,255,0,0.5)',
              0.6, 'rgba(255,255,0,0.6)',
              0.8, 'rgba(255,150,0,0.7)',
              1, 'rgba(255,0,0,0.8)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 10,
              9, 25
            ],
            'heatmap-opacity': 0.8
          }
        });
      }

      if (map.current && mapLoaded) {
        useHeatmapInteractions(map.current, cities, setSelectedHeatspot, setIsDrawerExpanded);
      }

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  }, [map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded, isVisibleOnHeatmap]);

  return { updateHeatmap, cities };
};
