import axios, { HttpStatusCode } from 'axios';
import { config } from '@config/config';
import type { AxiosAdapter, AxiosInstance, CreateAxiosDefaults } from 'axios';

export type ApiSuccessResponse<T> = {
  data: T;
};

type ApiErrorResponse = {
  error?: {
    code?: string;
    details?: unknown;
    message?: string;
    status?: number;
  };
};

export type ApiError = {
  code?: string;
  details?: unknown;
  message: string;
  status?: number;
  type: 'http' | 'network' | 'unknown';
};

export type ApiClient = AxiosInstance;

type CreateApiClientOptions = {
  adapter?: AxiosAdapter;
  baseURL?: string;
};

const DEFAULT_ERROR_MESSAGE = 'Something went wrong. Please try again.';

const getBackendError = (data: unknown): ApiErrorResponse['error'] => {
  if (typeof data !== 'object' || data === null || !('error' in data)) {
    return undefined;
  }

  return (data as ApiErrorResponse).error;
};

/**
 * Reads the typed payload from the backend success envelope.
 */
export const unwrapApiResponse = <T>(response: ApiSuccessResponse<T>): T => response.data;

/**
 * Converts backend and transport failures into a predictable UI-facing shape.
 */
export const normalizeApiError = (error: unknown): ApiError => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    if (error.response) {
      const backendError = getBackendError(error.response.data);

      return {
        code: backendError?.code,
        details: backendError?.details,
        message: backendError?.message || error.message,
        status: backendError?.status ?? error.response.status,
        type: 'http',
      };
    }

    return {
      code: undefined,
      details: undefined,
      message: error.message || DEFAULT_ERROR_MESSAGE,
      status: undefined,
      type: 'network',
    };
  }

  if (error instanceof Error) {
    return {
      code: undefined,
      details: undefined,
      message: error.message,
      status: undefined,
      type: 'unknown',
    };
  }

  return {
    code: undefined,
    details: undefined,
    message: DEFAULT_ERROR_MESSAGE,
    status: undefined,
    type: 'unknown',
  };
};

const createAxiosConfig = ({ adapter, baseURL }: CreateApiClientOptions): CreateAxiosDefaults => ({
  adapter,
  baseURL: baseURL ?? config.apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

/**
 * Creates a configured Axios instance for feature-level API modules.
 */
export const createApiClient = (options: CreateApiClientOptions = {}): ApiClient => {
  const client = axios.create(createAxiosConfig(options));

  client.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(normalizeApiError(error)),
  );

  return client;
};

export const apiClient = createApiClient();

export const isClientError = (status?: number): boolean =>
  status !== undefined && status >= HttpStatusCode.BadRequest && status < HttpStatusCode.InternalServerError;
