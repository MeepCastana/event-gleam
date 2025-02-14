
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
