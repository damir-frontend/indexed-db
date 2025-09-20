import dayjs from '@dayjs';
import { create } from '@utils';

const DB_NAME = 'GeoLayersDB';
const STORE_NAME = 'layers';

interface IndexedDBStoreState {
  db: IDBDatabase | null;
  openDB: () => Promise<IDBDatabase>;
  getDB: () => Promise<IDBDatabase>;
  saveLayerToCache: (id: string, data: any) => Promise<void>;
  getLayerFromCache: (id: string) => Promise<any | null>;
  clearOldData: (db: IDBDatabase) => void;
  closeDB: () => void;
}

export const useIndexedDBStore = create<IndexedDBStoreState>((set, get) => ({
  db: null,

  openDB: async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        const db = request.result;
        set({ db });

        // Удаляем старые данные
        get().clearOldData(db);

        resolve(db);
      };

      request.onerror = () => reject(request.error);
    });
  },

  getDB: async () => {
    let { db, openDB } = get();
    if (!db) {
      db = await openDB();
      set({ db });
    }
    return db;
  },

  saveLayerToCache: async (id, data) => {
    const db = await get().getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({ id, data });
    return tx.complete;
  },

  getLayerFromCache: async (id) => {
    const db = await get().getDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result ? request.result.data : null);
      request.onerror = () => resolve(null);
    });
  },

  clearOldData: (db) => {
    const today = dayjs.utc().format('DDMMYYYY').replace(/\./g, '');
    const tx = db.transaction('layers', 'readwrite');
    const store = tx.objectStore('layers');
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const key = cursor.key;
        const keyDate = key.split('-')[1]; // Извлекаем дату из ключа
        if (keyDate !== today) {
          store.delete(key);
        }
        cursor.continue();
      }
    };
  },

  closeDB: () => {
    const { db } = get();
    if (db) {
      db.close();
      set({ db: null });
    }
  },
}));
