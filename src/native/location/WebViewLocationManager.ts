
import { LocationBridgeConfig, NativePosition, LocationError } from './LocationBridge';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void;
    };
  }
}

export class WebViewLocationManager {
  private static instance: WebViewLocationManager;
  private watchId: number | null = null;
  private config: LocationBridgeConfig | null = null;
  private locationCallback: ((position: NativePosition) => void) | null = null;
  private errorCallback: ((error: LocationError) => void) | null = null;

  private constructor() {
    this.setupMessageListener();
  }

  public static getInstance(): WebViewLocationManager {
    if (!WebViewLocationManager.instance) {
      WebViewLocationManager.instance = new WebViewLocationManager();
    }
    return WebViewLocationManager.instance;
  }

  private setupMessageListener() {
    window.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data);
        switch (message.type) {
          case 'LOCATION_UPDATE':
            if (this.locationCallback) {
              this.locationCallback(message.payload as NativePosition);
            }
            break;
          case 'LOCATION_ERROR':
            if (this.errorCallback) {
              this.errorCallback(message.payload as LocationError);
            }
            break;
          default:
            console.warn('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
  }

  public startLocationUpdates(
    config: LocationBridgeConfig,
    callbacks: {
      onLocation: (position: NativePosition) => void;
      onError: (error: LocationError) => void;
    }
  ): void {
    this.config = config;
    this.locationCallback = callbacks.onLocation;
    this.errorCallback = callbacks.onError;

    if (window.ReactNativeWebView) {
      // We're in a WebView, use native location
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'START_LOCATION_UPDATES',
        payload: config
      }));
    } else {
      // Fallback to web geolocation
      this.startWebGeolocation();
    }
  }

  private startWebGeolocation(): void {
    if (!this.config) return;

    if ('geolocation' in navigator) {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (this.locationCallback) {
            this.locationCallback({
              coords: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                heading: position.coords.heading,
                altitude: position.coords.altitude
              },
              timestamp: position.timestamp
            });
          }
        },
        (error) => {
          if (this.errorCallback) {
            this.errorCallback({
              code: error.code,
              message: error.message
            });
          }
        },
        {
          enableHighAccuracy: this.config.enableHighAccuracy,
          timeout: 5000,
          maximumAge: this.config.minTimeInterval
        }
      );
    }
  }

  public stopLocationUpdates(): void {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'STOP_LOCATION_UPDATES'
      }));
    } else if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    
    this.locationCallback = null;
    this.errorCallback = null;
  }
}

