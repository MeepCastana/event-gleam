
import mapboxgl from 'mapbox-gl';

export interface LocationMarkerProps {
  arrowColor?: string;
  dotSize?: number;
  map: mapboxgl.Map;
}

export const createLocationMarker = ({ arrowColor = '#4287f5', dotSize = 200, map }: LocationMarkerProps) => {
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
      const scale = size / 63; // The original SVG is 63x63

      // Move to center and scale the drawing
      context.save();
      context.translate(centerX, centerY);
      context.scale(scale, scale);
      context.translate(-31.5, -31.5); // Center of 63x63

      // Draw the marker path
      context.beginPath();
      context.moveTo(23.70577136594, 9.3230854637602);
      context.arc(31.5, 9.3230854637602, 9, -2.498091544796509, -0.6435011087932844, true);
      context.lineTo(59.70577136594, 44.67691453624);
      context.arc(51.91154273188, 58.17691453624, 9, -0.6435011087932844, -2.498091544796509, true);
      context.lineTo(11.08845726812, 58.17691453624);
      context.arc(3.29422863406, 44.67691453624, 9, -2.498091544796509, -0.6435011087932844, true);
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
