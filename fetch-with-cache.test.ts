import { forecastTimeStore } from '@app/features/LoadingStatusLine/ui/model';
import { useIndexedDBStore } from '@app/utils/indexed-db';
import { axios } from '@utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchWithCache } from './fetch-with-cache';

// ==== Mock dependencies ====
vi.mock('@app/utils/indexed-db', () => ({
  useIndexedDBStore: { getState: vi.fn() },
}));

vi.mock('@utils', () => ({
  axios: { post: vi.fn() },
}));

vi.mock('@root/ip_config', () => ({
  IPConfig: { API_URL: 'https://api.example.com' },
}));

vi.mock('@app/features/LoadingStatusLine/ui/model', () => ({
  forecastTimeStore: { getState: vi.fn() },
}));

describe('fetchWithCache', () => {
  const mockGetLayerFromCache = vi.fn();
  const mockSaveLayerToCache = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock IndexedDB store methods
    (useIndexedDBStore.getState as unknown as () => any).mockReturnValue({
      getLayerFromCache: mockGetLayerFromCache,
      saveLayerToCache: mockSaveLayerToCache,
    });

    // Mock forecast time
    (forecastTimeStore.getState as unknown as () => any).mockReturnValue({
      forecastTime: '2025-08-22 12:00',
    });
  });

  it('returns data from cache if available', async () => {
    mockGetLayerFromCache.mockResolvedValue({ foo: 'cached' });

    const result = await fetchWithCache('prefix', '/endpoint', { a: 1 });

    expect(result).toEqual({ data: { foo: 'cached' } });
    expect(mockGetLayerFromCache).toHaveBeenCalledTimes(1);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('fetches data from server and saves to cache if not found in cache', async () => {
    mockGetLayerFromCache.mockResolvedValue(undefined);
    (axios.post as any).mockResolvedValue({ data: { foo: 'server' } });

    const result = await fetchWithCache('prefix', '/endpoint', { b: 2 });

    expect(axios.post).toHaveBeenCalledWith(
      'https://api.example.com/endpoint',
      { b: 2 },
      { signal: undefined },
    );
    expect(mockSaveLayerToCache).toHaveBeenCalledWith(
      expect.stringMatching(/^prefix-\d+-202508221200-b-2$/),
      { foo: 'server' },
    );
    expect(result).toEqual({ data: { foo: 'server' } });
  });

  it('generates cacheKey with sorted keys', async () => {
    mockGetLayerFromCache.mockResolvedValue(undefined);
    (axios.post as any).mockResolvedValue({ data: { sorted: true } });

    await fetchWithCache('test', '/endpoint', { z: 1, a: 2 });

    expect(mockSaveLayerToCache).toHaveBeenCalledWith(expect.stringMatching(/-a-2-z-1$/), {
      sorted: true,
    });
  });
});
