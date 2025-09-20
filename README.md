# IndexedDB Cache & Fetch Module

This repository demonstrates **IndexedDB caching** for frontend applications using **TypeScript** and **Vitest** for testing.

## Files

- **`indexed-db.ts`**  
  Zustand store `useIndexedDBStore` for IndexedDB access.  
  Key methods: `openDB()`, `getDB()`, `saveLayerToCache(id, data)`, `getLayerFromCache(id)`, `clearOldData(db)`, `closeDB()`.

- **`fetch-with-cache.ts`**  
  Universal `fetchWithCache` function: fetches from server or returns cached data.  
  Generates cache keys from prefix, date, forecast time, and request parameters.  
  Saves server responses to IndexedDB automatically.

- **`indexed-db.test.ts`**  
  Unit tests for `useIndexedDBStore` using fake `DB`, `Store`, and `Request` classes.  
  Tests DB opening, lazy initialization, save/get operations, clearing old data, and closing.

- **`fetch-with-cache.test.ts`**  
  Unit tests for `fetchWithCache` with mocked dependencies (`useIndexedDBStore`, `axios`, `forecastTimeStore`, `IPConfig`).  
  Tests cache hits, server requests, data saving, and key sorting.

## Features

- Fully typed with TypeScript (`IndexedDBStoreState`)  
- Automatic removal of outdated entries  
- Generic `fetchWithCache` for any API request  
- Fully isolated tests with Vitest  

## API Module (`api.ts`)

This module provides functions to fetch forecast data: snow, rain, and raster datasets.  
Each function internally uses `fetchWithCache`, so data is automatically returned from **IndexedDB cache** if available, or fetched from the server otherwise.  

Functions included:  

- `fetchNewSnowData(date, interval, source, colormap, signal)`  
- `fetchNewRainData(date, interval, source, colormap, signal)`  
- `fetchRasterData(key, source, categoryName, colormap, signal)`  

**Behavior:**  
- Returns cached data if available.  
- Otherwise fetches from the server and caches it for future use.  
- Cache keys include prefix, date, forecast time, and request parameters.  

This keeps API calls consistent, efficient, and improves UX by reducing unnecessary server requests.
