
import { useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';
import { supabase } from "@/integrations/supabase/client";
import { CityInfo } from '@/types/map';

const cities: CityInfo[] = [
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
  { lat: 51.5074, lng: -0.1278, weight: 1.8, name: "London" },
  { lat: 48.8566, lng: 2.3522, weight: 1.7, name: "Paris" },
  { lat: 52.5200, lng: 13.4050, weight: 1.6, name: "Berlin" },
  { lat: 41.9028, lng: 12.4964, weight: 1.5, name: "Rome" },
  { lat: 52.3676, lng: 4.9041, weight: 1.4, name: "Amsterdam" },
  { lat: 48.2082, lng: 16.3738, weight: 1.3, name: "Vienna" },
  { lat: 40.4168, lng: -3.7038, weight: 1.6, name: "Madrid" },
  { lat: 59.9139, lng: 10.7522, weight: 1.2, name: "Oslo" },
  { lat: 40.7128, lng: -74.0060, weight: 1.9, name: "New York" },
  { lat: 34.0522, lng: -118.2437, weight: 1.8, name: "Los Angeles" },
  { lat: 41.8781, lng: -87.6298, weight: 1.7, name: "Chicago" },
  { lat: 29.7604, lng: -95.3698, weight: 1.6, name: "Houston" },
  { lat: 39.9526, lng: -75.1652, weight: 1.5, name: "Philadelphia" },
  { lat: 37.7749, lng: -122.4194, weight: 1.6, name: "San Francisco" },
];

export const useHeatmap = (
  map: MutableRefObject<mapboxgl.Map | null>,
  mapLoaded: boolean,
  setSelectedHeatspot: (heatspot: { cityName: string; coordinates: [number, number]; intensity: number; } | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void
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

      setupHeatmapInteractions(map.current, cities, setSelectedHeatspot, setIsDrawerExpanded);

    } catch (error) {
      console.error('Error updating heatmap:', error);
    }
  }, [map, mapLoaded, setSelectedHeatspot, setIsDrawerExpanded]);

  return { updateHeatmap, cities };
};

function setupHeatmapInteractions(
  map: mapboxgl.Map,
  cities: CityInfo[],
  setSelectedHeatspot: (heatspot: { cityName: string; coordinates: [number, number]; intensity: number; } | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void
) {
  let isClickingHeatspot = false;

  map.on('click', 'heatmap-layer', (e) => {
    if (!e.features?.[0]) return;

    isClickingHeatspot = true;

    const coords = e.features[0].geometry.type === 'Point' 
      ? e.features[0].geometry.coordinates as [number, number]
      : undefined;

    if (coords) {
      map.flyTo({
        center: [coords[0], coords[1]],
        zoom: 12,
        duration: 1500,
        essential: true
      });

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
      
      setIsDrawerExpanded(true);
    }
  });

  map.on('mouseenter', 'heatmap-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'heatmap-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  return isClickingHeatspot;
}
