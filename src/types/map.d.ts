
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

declare global {
  interface Navigator {
    wakeLock?: {
      request(type: 'screen'): Promise<WakeLockSentinel>;
    };
  }
}

interface WakeLockSentinel extends EventTarget {
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
