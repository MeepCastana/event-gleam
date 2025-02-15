
import { useState } from 'react';
import mapboxgl from 'mapbox-gl';

interface UseMapThemeProps {
  map: React.MutableRefObject<mapboxgl.Map | null>;
  updateHeatmap: () => void;
}

export const useMapTheme = ({ map, updateHeatmap }: UseMapThemeProps) => {
  const [isDarkMap, setIsDarkMap] = useState(() => {
    const savedTheme = localStorage.getItem('mapTheme');
    return savedTheme === 'dark';
  });

  const toggleTheme = () => {
    const newTheme = !isDarkMap;
    setIsDarkMap(newTheme);
    localStorage.setItem('mapTheme', newTheme ? 'dark' : 'light');
    
    if (map.current) {
      map.current.once('style.load', () => {
        console.log('Style loaded, updating heatmap...');
        updateHeatmap();
      });
      
      map.current.setStyle(newTheme 
        ? 'mapbox://styles/meep-box/cm75w4ure009601r00el4cof3'
        : 'mapbox://styles/meep-box/cm75waj9c007o01r8cyxx7qrv'
      );
    }
  };

  return { isDarkMap, toggleTheme };
};
