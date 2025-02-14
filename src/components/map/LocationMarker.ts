
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
      const duration = 1000;
      const t = performance.now() % duration / duration;
      const radius = size / 2 * 0.3;
      const outerRadius = size / 2 * 0.7 * t + radius;
      const context = this.context;

      if (!context) return false;

      // Clear the canvas
      context.clearRect(0, 0, this.width, this.height);

      // Draw the outer circle (pulsing effect)
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, outerRadius, 0, Math.PI * 2);
      context.fillStyle = `rgba(66, 135, 245, ${1 - t})`;
      context.fill();

      // Draw the inner circle (location dot)
      context.beginPath();
      context.arc(this.width / 2, this.height / 2, radius, 0, Math.PI * 2);
      context.fillStyle = arrowColor;
      context.strokeStyle = 'white';
      context.lineWidth = 2 + 4 * (1 - t);
      context.fill();
      context.stroke();

      // Draw the direction arrow
      if (window.deviceHeading !== undefined) {
        const arrowLength = radius * 2;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        context.save();
        context.translate(centerX, centerY);
        context.rotate((window.deviceHeading * Math.PI) / 180);
        
        context.beginPath();
        context.moveTo(0, -radius - arrowLength);
        context.lineTo(-radius / 2, -radius);
        context.lineTo(radius / 2, -radius);
        context.closePath();
        
        context.fillStyle = arrowColor;
        context.fill();
        context.strokeStyle = 'white';
        context.lineWidth = 2;
        context.stroke();
        
        context.restore();
      }

      this.data = context.getImageData(0, 0, this.width, this.height).data;
      map.triggerRepaint();

      return true;
    }
  };
};
