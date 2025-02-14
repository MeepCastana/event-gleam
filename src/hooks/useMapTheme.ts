
import { useState, useCallback, MutableRefObject } from 'react';
import mapboxgl from 'mapbox-gl';

export const useMapTheme = (map?: MutableRefObject<mapboxgl.Map | null>, onStyleChange?: () => void) => {
  const [isDarkMap, setIsDarkMap] = useState(() => {
    const savedTheme = localStorage.getItem('mapTheme');
    return savedTheme === 'dark';
  });

  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMap;
    setIsDarkMap(newTheme);
    localStorage.setItem('mapTheme', newTheme ? 'dark' : 'light');
    
    if (map?.current) {
      map.current.setStyle(
        newTheme
          ? 'mapbox://styles/meep-box/cm74hanck01sg01qxbdh782lk'
          : 'mapbox://styles/meep-box/cm74r9wnp007t01r092kthims'
      );

      if (onStyleChange) {
        map.current.once('style.load', onStyleChange);
      }
    }
  }, [isDarkMap, map, onStyleChange]);

  return { isDarkMap, toggleTheme };
};
