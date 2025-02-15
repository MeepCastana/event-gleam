
interface HeatPoint {
  latitude: number;
  longitude: number;
  weight: number;
  userId: string;
}

export const calculateHeatmapWeight = (points: HeatPoint[], radius: number = 100): HeatPoint[] => {
  const aggregatedPoints = new Map<string, HeatPoint>();

  points.forEach(point => {
    // Find nearby points within radius
    const nearbyPoints = points.filter(p => 
      calculateDistance(point.latitude, point.longitude, p.latitude, p.longitude) <= radius
    );

    // Calculate weight based on proximity of other users
    // For single user, keep weight very low (0.2)
    // Only increase significantly when multiple users are present
    const weight = nearbyPoints.length === 1 
      ? 0.2  // Single user - keep very low
      : Math.min(nearbyPoints.length * 0.15, 1.5); // Multiple users, capped at 1.5
    
    const key = `${point.latitude.toFixed(4)},${point.longitude.toFixed(4)}`;
    
    if (!aggregatedPoints.has(key) || aggregatedPoints.get(key)!.weight < weight) {
      aggregatedPoints.set(key, {
        ...point,
        weight: weight
      });
    }
  });

  return Array.from(aggregatedPoints.values());
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

export const calculateHeatmapRadius = (points: HeatPoint[]): number => {
  const BASE_RADIUS = 15; // Reduced from 25 to make single-user points smaller
  const userCount = new Set(points.map(p => p.userId)).size;
  
  if (userCount > 10) {
    // Dynamically increase radius based on user count, but with diminishing returns
    return BASE_RADIUS * (1 + Math.log10(userCount / 10));
  }
  
  return BASE_RADIUS;
};
