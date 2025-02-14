
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

      // Update animation frame
      animationFrame = (animationFrame + 1) % 60;
      const pulseScale = 1 + Math.sin(animationFrame * (Math.PI / 30)) * 0.1;

      // Clear the canvas
      context.clearRect(0, 0, this.width, this.height);

      // Calculate center
      const centerX = this.width / 2;
      const centerY = this.height / 2;

      // Move to center and apply pulsing scale
      context.save();
      context.translate(centerX, centerY);
      context.scale(pulseScale, pulseScale);
      context.translate(-centerX, -centerY);

      // Draw the marker path
      context.beginPath();
      context.moveTo(centerX - 8, centerY - 15);
      context.arc(centerX, centerY - 15, 8, Math.PI, 0, false);
      context.lineTo(centerX + 8, centerY + 8);
      context.arc(centerX, centerY + 8, 8, 0, Math.PI, false);
      context.closePath();

      // Fill with blue color and add some shadow for depth
      context.shadowColor = arrowColor;
      context.shadowBlur = 10;
      context.fillStyle = arrowColor;
      context.fill();

      // Restore the context
      context.restore();

      this.data = context.getImageData(0, 0, this.width, this.height).data;
      map.triggerRepaint();

      return true;
    }
  };
};
