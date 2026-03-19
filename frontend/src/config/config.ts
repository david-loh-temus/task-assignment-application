const DEFAULT_API_BASE_URL = 'http://127.0.0.1:4000';

export const parseApiBaseUrl = (value?: string): string => value?.trim() || DEFAULT_API_BASE_URL;

export type AppConfig = {
  readonly apiBaseUrl: string;
};

export const isDev = import.meta.env.DEV;

export const config: AppConfig = {
  apiBaseUrl: parseApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
};
