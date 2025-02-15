
export interface CityInfo {
  lat: number;
  lng: number;
  weight: number;
  name: string;
}

export interface HeatspotInfo {
  cityName: string;
  coordinates: [number, number];
  intensity: number;
}

export interface GeofenceArea {
  id: string;
  name: string;
  center: [number, number];
  radius: number; // in meters
}

export interface LocationHistoryEntry {
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  speed?: number;
  heading?: number;
  user_id: string;
  id: string;
  created_at: string;
}

declare global {
  interface Window {
    deviceHeading?: number;
  }
}
