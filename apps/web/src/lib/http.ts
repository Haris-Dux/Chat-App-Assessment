import type { ApiErrorBody } from '@concierge/contracts';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: ApiErrorBody['details'];

  constructor(status: number, message: string, details?: ApiErrorBody['details']) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`/api${path}`, { credentials: 'same-origin', ...init });
  } catch {
    throw new ApiError(0, "Can't reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      body?.message ?? 'Something went wrong. Please try again.',
      body?.details,
    );
  }

  return response.status === 204 ? (undefined as T) : (response.json() as Promise<T>);
}

export const http = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
};
