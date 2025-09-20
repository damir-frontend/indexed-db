import { forecastTimeStore } from '@app/features/LoadingStatusLine/ui/model';
import { useIndexedDBStore } from '@app/utils/indexed-db';
import { IPConfig } from '@root/ip_config';
import { axios } from '@utils';

export const fetchWithCache = async <T>(
  cachePrefix: string,
  apiEndpoint: string,
  requestData: Record<string, any>,
  signal?: AbortSignal, // Добавляем сигнал для отмены запроса
): Promise<{ data: T }> => {
  const store = useIndexedDBStore.getState();
  const cacheKey = generateCacheKey(cachePrefix, requestData);

  // Проверяем кэш
  const cachedData = await store.getLayerFromCache(cacheKey);
  if (cachedData) {
    return { data: cachedData as T };
  }

  // Загружаем с сервера
  const response = await axios.post(
    `${IPConfig.API_URL}${apiEndpoint}`,
    requestData,
    { signal }, // Передаем сигнал для отмены запроса
  );
  const { data } = response;

  // Сохраняем в кэш
  if (data) {
    await store.saveLayerToCache(cacheKey, data);
  }

  return response;
};

const generateCacheKey = (prefix: string, requestData: Record<string, any>): string => {
  const today = new Date().toLocaleDateString('ru-RU').replace(/\./g, '');
  const forecastTime = forecastTimeStore.getState().forecastTime.replace(/\D/g, '');
  const sortedEntries = Object.entries(requestData)
    .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)) // Сортируем ключи для стабильности
    .map(([key, value]) => `${key}-${value}`) // Преобразуем в строки
    .join('-'); // Объединяем

  return `${prefix}-${today}-${forecastTime}-${sortedEntries}`;
};
