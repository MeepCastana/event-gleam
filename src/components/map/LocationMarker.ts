
import mapboxgl from 'mapbox-gl';

export interface LocationMarkerProps {
  arrowColor?: string;
  dotSize?: number;
  map: mapboxgl.Map;
}

export const createLocationMarker = ({ arrowColor = '#4287f5', dotSize = 60, map }: LocationMarkerProps) => {
  const size = dotSize;
  
  return {
    width: size,
    height: size,
    data: new Uint8Array(size * size * 4),
    onAdd: function () {
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      this.context = canvas.getContext('2d');
    },
    render: function () {
      const context = this.context;
      if (!context) return false;

      // Clear the canvas
      context.clearRect(0, 0, this.width, this.height);

      // Calculate center and scale for the marker
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const scale = 0.95; // Scale slightly smaller than the canvas

      // Move to center and scale the drawing
      context.save();
      context.translate(centerX, centerY);
      context.scale(scale, scale);
      context.translate(-centerX, -centerY);

      // Draw the marker path - scaled to fit within the canvas
      context.beginPath();
      context.moveTo(centerX - 15, centerY - 20);
      context.arc(centerX, centerY - 20, 15, Math.PI, 0, false);
      context.lineTo(centerX + 15, centerY + 15);
      context.arc(centerX, centerY + 15, 15, 0, Math.PI, false);
      context.closePath();

      // Fill with blue color
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
