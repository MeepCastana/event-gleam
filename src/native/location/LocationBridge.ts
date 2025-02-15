
export interface NativePosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    speed: number | null;
    heading: number | null;
    altitude: number | null;
  };
  timestamp: number;
}

export interface LocationBridgeConfig {
  minDistance: number;
  minTimeInterval: number;
  userId: string | null;
  enableHighAccuracy: boolean;
}

export interface LocationError {
  code: number;
  message: string;
}

export interface LocationUpdateCallback {
  onLocationUpdate: (position: NativePosition) => void;
  onError: (error: LocationError) => void;
}

export const MIN_DISTANCE = 10; // meters
export const MIN_TIME = 30000; // 30 seconds

// This will be implemented differently in native code
export const requestLocationPermission = async (): Promise<boolean> => {
  if (window.ReactNativeWebView) {
    // We're in a WebView
    return new Promise((resolve) => {
      const handleMessage = (event: MessageEvent) => {
        try {
          const response = JSON.parse(event.data);
          if (response.type === 'PERMISSION_RESULT') {
            window.removeEventListener('message', handleMessage);
            resolve(response.granted);
          }
        } catch (error) {
          console.error('Error parsing permission response:', error);
          window.removeEventListener('message', handleMessage);
          resolve(false);
        }
      };

      window.addEventListener('message', handleMessage);
      
      // Send permission request to native side
      window.ReactNativeWebView.postMessage(
        JSON.stringify({ type: 'REQUEST_LOCATION_PERMISSION' })
      );
    });
  }
  
  // Fallback to web permissions
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state === 'granted';
  } catch (error) {
    console.error('Error checking permissions:', error);
    return false;
  }
};
