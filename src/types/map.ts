
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

export interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  release(): Promise<void>;
  addEventListener(
    type: 'release',
    listener: (this: WakeLockSentinel, ev: Event) => any,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: 'release',
    listener: (this: WakeLockSentinel, ev: Event) => any,
    options?: boolean | EventListenerOptions
  ): void;
}

declare global {
  interface Navigator {
    wakeLock: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }
}
