
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

async function syncLocation() {
  try {
    // Get the current position using the Geolocation API
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000
      });
    });

    const locationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      source: 'background',
      timestamp: new Date().toISOString()
    };

    // Store the location data in IndexedDB for offline support
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
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}
