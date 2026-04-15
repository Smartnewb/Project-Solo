// shared/lib/http/admin-fetch.ts

const PROXY_BASE = '/api/admin-proxy';

export class AdminApiError extends Error {
  public response: {
    status: number;
    data?: unknown;
  };

  constructor(
    message: string,
    public status: number,
    public body?: unknown,
  ) {
    super(message);
    this.name = 'AdminApiError';
    this.response = {
      status,
      data: body,
    };
  }
}

export function getAdminErrorMessage(error: unknown, fallback = '요청 실패'): string {
  if (error instanceof AdminApiError) {
    return (error.body as { message?: string } | null)?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

async function parseJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

export type AdminQueryValue =
  | string
  | number
  | boolean
  | string[]
  | undefined
  | null;
export type AdminQueryParams = Record<string, AdminQueryValue>;

async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  path: string,
  options?: { body?: unknown; params?: AdminQueryParams },
): Promise<T> {
  let url = `${PROXY_BASE}${path}`;

  if (options?.params) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value == null || value === '') continue;
      if (Array.isArray(value)) {
        for (const v of value) search.append(key, v);
      } else {
        search.append(key, String(value));
      }
    }
    const qs = search.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: options?.body
      ? { 'Content-Type': 'application/json' }
      : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await parseJsonBody<unknown>(res).catch(() => null);
    throw new AdminApiError(
      (body as { message?: string } | null)?.message ?? `Request failed: ${res.status}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) return undefined as T;
  return parseJsonBody<T>(res);
}

export function buildAdminProxyUrl(path: string): string {
  if (path.startsWith(PROXY_BASE)) return path;
  return `${PROXY_BASE}${path}`;
}

export async function adminRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(buildAdminProxyUrl(path), init);

  if (!res.ok) {
    const body = await parseJsonBody<unknown>(res).catch(() => null);
    throw new AdminApiError(
      (body as { message?: string } | null)?.message ?? `Request failed: ${res.status}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) return undefined as T;
  return parseJsonBody<T>(res);
}

export function adminGet<T>(
  path: string,
  params?: AdminQueryParams,
): Promise<T> {
  return request<T>('GET', path, { params });
}

export function adminPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, { body });
}

export function adminPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PUT', path, { body });
}

export function adminPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, { body });
}

export function adminDelete<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('DELETE', path, { body });
}
