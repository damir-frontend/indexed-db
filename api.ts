import { fetchWithCache } from '@app/utils';
import { TMeteodataSource } from '@app/utils/consts';

export const fetchNewSnowData = (
  date: string,
  interval: number,
  source: TMeteodataSource,
  colormap: string,
  signal?: AbortSignal,
): Promise<{ data: any }> => {
  return fetchWithCache('snow', 'forecast/accumulation/snow', {
    date,
    interval,
    source,
    colormap,
    signal,
  });
};

export const fetchNewRainData = (
  date: string,
  interval: number,
  source: TMeteodataSource,
  colormap: string,
  signal?: AbortSignal,
): Promise<{ data: any }> => {
  return fetchWithCache('rain', 'forecast/accumulation/precipitation2', {
    date,
    interval,
    source,
    colormap,
    signal,
  });
};

export const fetchRasterData = (
  key: string,
  source: TMeteodataSource,
  categoryName: string,
  colormap: string,
  signal?: AbortSignal,
): Promise<{ data: any }> => {
  return fetchWithCache(
    'raster',
    'forecast/raster',
    { key, source, categoryName, colormap },
    signal,
  );
};
