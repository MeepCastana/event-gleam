
import mapboxgl from 'mapbox-gl';

export interface LocationMarkerProps {
  arrowColor?: string;
  dotSize?: number;
  map: mapboxgl.Map;
}

export const createLocationMarker = ({ arrowColor = '#4287f5', dotSize = 60, map }: LocationMarkerProps) => {
  const size = dotSize;
  let data = new Uint8Array(size * size * 4);
  let animationFrame = 0;
  
  return {
    width: size,
    height: size,
    data: data,
    onAdd: function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },
    render: function () {
      const context = this.context;
      if (!context) return false;

      // Update animation frame with slower speed
      animationFrame = (animationFrame + 0.5) % 60;
      const pulseScale = 1 + Math.sin(animationFrame * (Math.PI / 45)) * 0.3;

      // Clear the canvas
      context.clearRect(0, 0, this.width, this.height);

      // Calculate center
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      // Draw pulsing ring
      const maxRadius = size / 3;
      context.beginPath();
      context.arc(centerX, centerY, maxRadius * pulseScale, 0, Math.PI * 2);
      context.fillStyle = `${arrowColor}20`;
      context.fill();

      // Draw center dot (increased size from size/8 to size/6)
      context.beginPath();
      context.arc(centerX, centerY, size / 6, 0, Math.PI * 2);
      context.fillStyle = arrowColor;
      context.fill();

      this.data = context.getImageData(0, 0, this.width, this.height).data;
      map.triggerRepaint();

      return true;
    }
  };
};
