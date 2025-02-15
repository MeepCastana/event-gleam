
import mapboxgl from 'mapbox-gl';
import { CityInfo, HeatspotInfo } from '@/types/map';

export const useHeatmapInteractions = (
  map: mapboxgl.Map,
  cities: CityInfo[],
  setSelectedHeatspot: (heatspot: HeatspotInfo | undefined) => void,
  setIsDrawerExpanded: (expanded: boolean) => void
) => {
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

  map.on('click', (e) => {
    const features = map.queryRenderedFeatures(e.point, { layers: ['heatmap-layer'] });
    
    if (features.length === 0) {
      setSelectedHeatspot(undefined);
      setIsDrawerExpanded(false);
    }
  });

  map.on('mouseenter', 'heatmap-layer', () => {
    map.getCanvas().style.cursor = 'pointer';
  });

  map.on('mouseleave', 'heatmap-layer', () => {
    map.getCanvas().style.cursor = '';
  });

  return isClickingHeatspot;
};
