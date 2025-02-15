
const CACHE_NAME = 'wherry-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/10fef719-5863-41dc-b003-b6e1523355c7.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

// Add background sync for location updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-location') {
    event.waitUntil(syncLocation());
  }
});

// Add periodic sync for regular location updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'location-update') {
    event.waitUntil(syncLocation());
  }
});

let lastPosition = null;
let lastSync = null;
const MIN_DISTANCE = 10; // meters
const MIN_TIME = 60000; // 1 minute

function calculateDistance(lat1, lon1, lat2, lon2) {
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
}

async function syncLocation() {
  try {
    const now = Date.now();
    
    // Check if enough time has passed since last sync
    if (lastSync && (now - lastSync) < MIN_TIME) {
      console.log('Not enough time has passed since last sync');
      return;
    }

    // Get battery status if available
    let battery = null;
    if ('getBattery' in navigator) {
      battery = await navigator.getBattery();
    }

    // Adjust accuracy based on battery level
    const highAccuracy = !battery || battery.level > 0.2;

    // Get the current position
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: highAccuracy,
        maximumAge: highAccuracy ? 0 : 30000,
        timeout: 5000
      });
    });

    // Check if we've moved enough to warrant an update
    if (lastPosition) {
      const distance = calculateDistance(
        lastPosition.coords.latitude,
        lastPosition.coords.longitude,
        position.coords.latitude,
        position.coords.longitude
      );

      if (distance < MIN_DISTANCE) {
        console.log('Not enough distance covered since last update');
        return;
      }
    }

    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      source: 'background',
      timestamp: new Date().toISOString(),
      battery: battery ? battery.level : null
    };

    // Store location in IndexedDB for offline support
    const db = await openDB('location-store', 1, {
      upgrade(db) {
        db.createObjectStore('locations', { keyPath: 'timestamp' });
      }
    });

    await db.add('locations', locationData);

    // Try to sync with the server
    const response = await fetch('/api/location', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData)
    });

    if (!response.ok) {
      throw new Error('Failed to sync location');
    }

    // Update last position and sync time
    lastPosition = position;
    lastSync = now;

    // Send notification if significant movement detected
    if (self.registration.showNotification) {
      await self.registration.showNotification('Location Updated', {
        body: 'Your location has been successfully updated',
        icon: '/lovable-uploads/10fef719-5863-41dc-b003-b6e1523355c7.png',
        silent: true
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
