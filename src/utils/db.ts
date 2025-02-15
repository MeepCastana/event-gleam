
import { openDB, IDBPDatabase } from 'idb';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  altitude?: number;
  source: 'foreground' | 'background' | 'push';
  timestamp: string;
  userId: string;
}

interface WherryDB extends IDBPDatabase {
  locations: LocationData;
}

const DB_NAME = 'wherry-db';
const DB_VERSION = 1;

export async function initDB() {
  const db = await openDB<WherryDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('locations')) {
        const locationStore = db.createObjectStore('locations', {
          keyPath: 'timestamp'
        });
        locationStore.createIndex('userId', 'userId');
      }
    }
  });

  return db;
}

export async function storeLocationOffline(location: LocationData) {
  const db = await initDB();
  await db.add('locations', location);
}

export async function getSyncPendingLocations(userId: string) {
  const db = await initDB();
  const tx = db.transaction('locations', 'readonly');
  const index = tx.store.index('userId');
  return index.getAll(userId);
}

export async function clearSyncedLocations(timestamps: string[]) {
  const db = await initDB();
  const tx = db.transaction('locations', 'readwrite');
  await Promise.all(timestamps.map(timestamp => tx.store.delete(timestamp)));
  await tx.done;
}
