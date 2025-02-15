
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
      // Store the current center, zoom, pitch, and bearing
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      const pitch = map.current.getPitch();
      const bearing = map.current.getBearing();

      // Update control styles before changing the map style
      const mapControls = document.querySelectorAll('.mapboxgl-ctrl-group');
      mapControls.forEach(control => {
        control.setAttribute(
          'style',
          `background-color: ${newTheme ? 'rgba(63, 63, 70, 0.9)' : 'rgba(24, 24, 27, 0.95)'} !important`
        );

        // Update specific control buttons
        const zoomIn = control.querySelector('.mapboxgl-ctrl-zoom-in');
        const zoomOut = control.querySelector('.mapboxgl-ctrl-zoom-out');
        const compass = control.querySelector('.mapboxgl-ctrl-compass');
        
        [zoomIn, zoomOut, compass].forEach(button => {
          if (button) {
            button.setAttribute(
              'style',
              `background-color: ${newTheme ? 'rgba(63, 63, 70, 0.9)' : 'rgba(24, 24, 27, 0.95)'} !important`
            );
          }
        });
      });

      map.current.once('style.load', () => {
        // Restore the previous view state
        map.current?.setCenter(center);
        map.current?.setZoom(zoom);
        map.current?.setPitch(pitch);
        map.current?.setBearing(bearing);

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
