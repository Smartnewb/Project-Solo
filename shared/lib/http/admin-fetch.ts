// shared/lib/http/admin-fetch.ts
import {
  ADMIN_RETRY_HEADER,
  ADMIN_SESSION_EXPIRED_CODE,
} from '@/shared/auth/admin-auth-contract';

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
    // 어드민 v2 는 `{ error: { code, message } }`, 그 외는 최상위 message.
    const body = error.body as
      | { error?: { message?: string }; message?: string }
      | null;
    return body?.error?.message ?? body?.message ?? error.message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

/** 낙관적 락 충돌(409). 에러 메시지 문구가 아니라 상태 코드로 판정한다. */
export function isAdminConflictError(error: unknown): boolean {
  return error instanceof AdminApiError && error.status === 409;
}

const SESSION_RETRY_DELAY_MS = 400;

async function isSessionExpired(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  const body = await res.clone().json().catch(() => null);
  return (body as { code?: string } | null)?.code === ADMIN_SESSION_EXPIRED_CODE;
}

// 동시에 나간 다른 요청이 토큰을 먼저 갱신했을 수 있어 한 번만 다시 보낸다(그 사이 브라우저에 새 쿠키가 들어온다).
// 재시도도 만료면 프록시가 쿠키를 지웠으므로 로그인으로 보낸다.
async function fetchWithSessionRetry(url: string, init: RequestInit): Promise<Response> {
  const res = await fetch(url, init);
  if (!(await isSessionExpired(res))) return res;

  await new Promise((resolve) => setTimeout(resolve, SESSION_RETRY_DELAY_MS));
  const headers = new Headers(init.headers);
  headers.set(ADMIN_RETRY_HEADER, '1');
  const retried = await fetch(url, { ...init, headers });
  if ((await isSessionExpired(retried)) && typeof window !== 'undefined') {
    /* eslint-disable no-restricted-properties -- 쿠키를 지운 뒤라 라우터 이동이 아니라 전체 이동으로 middleware 를 다시 거쳐야 한다. */
    const next = `${window.location.pathname}${window.location.search}`;
    window.location.assign(`/?next=${encodeURIComponent(next)}`);
    /* eslint-enable no-restricted-properties */
  }
  return retried;
}

async function parseJsonBody<T>(res: Response): Promise<T> {
  const text = await res.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}

// 어드민 v2 에러 응답은 `{ error: { code, message } }`, 그 외는 최상위 `message`.
function extractErrorMessage(body: unknown, status: number): string {
  const b = body as { error?: { message?: string }; message?: string } | null;
  return b?.error?.message ?? b?.message ?? `Request failed: ${status}`;
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
  options?: {
    body?: unknown;
    params?: AdminQueryParams;
    headers?: Record<string, string>;
  },
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

  const baseHeaders: Record<string, string> = options?.body
    ? { 'Content-Type': 'application/json' }
    : {};
  const headers = { ...baseHeaders, ...(options?.headers ?? {}) };

  const res = await fetchWithSessionRetry(url, {
    method,
    headers: Object.keys(headers).length ? headers : undefined,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const body = await parseJsonBody<unknown>(res).catch(() => null);
    throw new AdminApiError(extractErrorMessage(body, res.status), res.status, body);
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
  const res = await fetchWithSessionRetry(buildAdminProxyUrl(path), init);

  if (!res.ok) {
    const body = await parseJsonBody<unknown>(res).catch(() => null);
    throw new AdminApiError(extractErrorMessage(body, res.status), res.status, body);
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

export function adminPost<T>(
  path: string,
  body?: unknown,
  options?: { headers?: Record<string, string> },
): Promise<T> {
  return request<T>('POST', path, { body, headers: options?.headers });
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

export async function adminUpload<T>(
  path: string,
  formData: FormData,
): Promise<T> {
  const res = await fetch(buildAdminProxyUrl(path), {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type — browser auto-sets with correct boundary
  });

  if (!res.ok) {
    const body = await parseJsonBody<unknown>(res).catch(() => null);
    throw new AdminApiError(extractErrorMessage(body, res.status), res.status, body);
  }

  if (res.status === 204) return undefined as T;
  return parseJsonBody<T>(res);
}
