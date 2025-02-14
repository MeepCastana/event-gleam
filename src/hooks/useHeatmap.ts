import { useEffect, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";

interface CityInfo {
  lat: number;
  lng: number;
  weight: number;
  name: string;
}

interface UseHeatmapProps {
  map: MutableRefObject<mapboxgl.Map | null>;
  mapLoaded: boolean;
}

export const useHeatmap = ({ map, mapLoaded }: UseHeatmapProps) => {
  const updateHeatmap = async () => {
    if (!map.current || !mapLoaded) return;

    try {
      console.log('Updating heatmap...');
      const { data: locations, error } = await supabase
        .from('user_locations')
        .select('latitude, longitude')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Major cities data
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
        const numPoints = Math.floor(city.weight * 30);
        for (let i = 0; i < numPoints; i++) {
          const radiusFactor = city.weight > 1 ? 0.03 : 0.05;
          const latOffset = (Math.random() - 0.5) * radiusFactor;
          const lngOffset = (Math.random() - 0.5) * radiusFactor;
          const randomWeight = city.weight * (0.5 + Math.random() * 0.5);
          
          points.push({
            type: "Feature" as const,
            properties: {
              weight: randomWeight,
              cityName: city.name
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
          properties: { weight: 1 },
          geometry: {
            type: "Point" as const,
            coordinates: [loc.longitude, loc.latitude]
          }
        })) || []),
        ...testPoints
      ];

      if (map.current.getSource('heatmap-source')) {
        (map.current.getSource('heatmap-source') as mapboxgl.GeoJSONSource).setData({
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
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
            'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(155, 135, 245, 0)',    // transparent purple #9b87f5
              0.2, 'rgb(242, 252, 226)',      // green #F2FCE2
              0.4, 'rgb(254, 247, 205)',      // yellow #FEF7CD
              0.6, 'rgb(254, 198, 161)',      // orange #FEC6A1
              0.8, 'rgb(234, 56, 76)',        // red #ea384c
              1, 'rgb(234, 56, 76)'           // solid red #ea384c
            ],
            'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
            'heatmap-opacity': 0.8
          }
        });
      }
    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  };

  useEffect(() => {
    if (mapLoaded) {
      updateHeatmap();
      const interval = setInterval(updateHeatmap, 30000);
      return () => clearInterval(interval);
    }
  }, [mapLoaded]);

  return { updateHeatmap };
};
