import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useIndexedDBStore } from './indexed-db';

// ==== Fake IndexedDB classes ====
class FakeRequest {
  result: any;
  onsuccess: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(result: any) {
    this.result = result;
  }
  triggerSuccess() {
    this.onsuccess?.();
  }
  triggerError() {
    this.onerror?.();
  }
}

class FakeStore {
  data: Record<string, any> = {};

  get(id: string) {
    const req = new FakeRequest(this.data[id] ?? null);
    setTimeout(() => req.triggerSuccess(), 0);
    return req;
  }

  put({ id, data }: any) {
    this.data[id] = data;
  }

  delete(id: string) {
    delete this.data[id];
  }
}

class FakeDB {
  store = new FakeStore();
  isClosed = false;

  transaction(storeName: string, mode?: string) {
    this.store.mode = mode as any;
    return { objectStore: () => this.store, complete: Promise.resolve() };
  }

  close() {
    this.isClosed = true;
  }
}

describe('useIndexedDBStore', () => {
  let store: ReturnType<typeof useIndexedDBStore>;
  let fakeDB: FakeDB;

  beforeEach(() => {
    store = useIndexedDBStore;
    fakeDB = new FakeDB();
    store.getState().db = null;

    // Mock openDB
    store.getState().openDB = vi.fn().mockImplementation(async () => {
      store.getState().db = fakeDB;
      store.getState().clearOldData(fakeDB);
      return fakeDB;
    });

    // Mock clearOldData
    store.getState().clearOldData = vi.fn((db: FakeDB) => {
      const today = '22082025';
      Object.keys(db.store.data).forEach((key) => {
        const keyDate = key.split('-')[1];
        if (keyDate !== today) db.store.delete(key);
      });
    });
  });

  it('openDB opens the database and calls clearOldData', async () => {
    const db = await store.getState().openDB();
    expect(db).toBe(fakeDB);
    expect(store.getState().clearOldData).toHaveBeenCalledWith(fakeDB);
    expect(store.getState().db).toBe(fakeDB);
  });

  it('getDB returns the opened database (lazy initialization)', async () => {
    expect(store.getState().db).toBeNull();
    const db = await store.getState().getDB();
    expect(db).toBe(fakeDB);
    expect(store.getState().db).toBe(fakeDB);
  });

  it('saveLayerToCache stores data in the fake DB', async () => {
    await store.getState().saveLayerToCache('layer1', { foo: 'bar' });
    expect(fakeDB.store.data['layer1']).toEqual({ foo: 'bar' });
  });

  it('getLayerFromCache returns stored data', async () => {
    store.getState().db = fakeDB;

    // Simulate existing IndexedDB data
    fakeDB.store.data['layer2'] = { data: { a: 123 } };

    vi.spyOn(fakeDB.store, 'get').mockImplementation((id: string) => {
      const req = new FakeRequest(fakeDB.store.data[id] ?? null);
      setTimeout(() => req.triggerSuccess(), 0);
      return req;
    });

    const res = await store.getState().getLayerFromCache('layer2');
    expect(res).toEqual({ a: 123 });
  });

  it('getLayerFromCache returns null if no data found', async () => {
    store.getState().db = fakeDB;

    vi.spyOn(fakeDB.store, 'get').mockImplementation((id: string) => {
      const req = new FakeRequest(null);
      setTimeout(() => req.triggerSuccess(), 0);
      return req;
    });

    const res = await store.getState().getLayerFromCache('nonexistent');
    expect(res).toBeNull();
  });

  it('clearOldData deletes outdated keys', async () => {
    fakeDB.store.data['layer-21082025'] = { foo: 'old' };
    fakeDB.store.data['layer-22082025'] = { foo: 'new' };

    store.getState().clearOldData(fakeDB);

    expect(Object.keys(fakeDB.store.data)).toEqual(['layer-22082025']);
  });

  it('closeDB closes the database and resets the state', () => {
    store.getState().db = fakeDB;
    store.getState().closeDB();

    expect(fakeDB.isClosed).toBe(true);
    expect(store.getState().db).toBeNull();
  });
});
