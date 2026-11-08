import { isAxiosError } from 'axios';

/** Treat remote error payloads as untrusted, even when Axios recognizes the response. */
export function apiErrorMessage(error: unknown): string | undefined {
  if (!isAxiosError<unknown>(error)) return undefined;
  const data = error.response?.data;
  return data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
    ? data.message : undefined;
}

export function apiErrorStatus(error: unknown): number | undefined {
  return isAxiosError(error) ? error.response?.status : undefined;
}
