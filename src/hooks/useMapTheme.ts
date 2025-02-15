
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
        ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
        : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
      );
    }
  };

  return { isDarkMap, toggleTheme };
};
