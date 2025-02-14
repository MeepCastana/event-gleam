
import mapboxgl from 'mapbox-gl';

export interface LocationMarkerProps {
  arrowColor?: string;
  dotSize?: number;
  map: mapboxgl.Map;
}

export const createLocationMarker = ({ arrowColor = '#1A1F2C', dotSize = 200, map }: LocationMarkerProps) => {
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

      // Calculate center and size for the play icon
      const centerX = this.width / 2;
      const centerY = this.height / 2;
      const iconSize = size * 0.4; // Slightly larger for better visibility

      // Rotate the context 90 degrees to point the play icon downward
      context.save();
      context.translate(centerX, centerY);
      context.rotate(Math.PI / 2); // 90 degrees in radians
      context.translate(-centerX, -centerY);

      // Draw the play icon shape
      context.beginPath();
      context.moveTo(centerX - iconSize * 0.5, centerY - iconSize * 0.5);
      context.lineTo(centerX + iconSize * 0.5, centerY);
      context.lineTo(centerX - iconSize * 0.5, centerY + iconSize * 0.5);
      context.closePath();

      // Fill with light color
      context.fillStyle = '#F6F6F7';
      context.fill();

      // Draw border
      context.lineWidth = 4;
      context.strokeStyle = arrowColor;
      context.stroke();

      // Restore the context rotation
      context.restore();

      this.data = context.getImageData(0, 0, this.width, this.height).data;
      map.triggerRepaint();

      return true;
    }
  };
};
