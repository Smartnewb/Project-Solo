/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Must mock next/headers before importing the route
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
  getAdminAccessToken: jest.fn(),
  getSessionMeta: jest.fn(),
  getAdminRefreshToken: jest.fn(),
  setAdminAccessToken: jest.fn(),
  setAdminRefreshToken: jest.fn(),
  clearAdminCookies: jest.fn(),
  setSessionMeta: jest.fn(),
  normalizeAdminCountry: jest.fn((c: string) => c || 'kr'),
}));

import { GET, POST, PUT, PATCH, DELETE } from '@/app/api/admin-proxy/[...path]/route';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const validMeta = {
  id: 'user-1',
  email: 'admin@test.com',
  roles: ['admin'],
  issuedAt: Date.now(),
  selectedCountry: 'kr',
};

function createRequest(
  path: string,
  options: { method?: string; body?: string; headers?: Record<string, string>; searchParams?: Record<string, string> } = {},
): NextRequest {
  const url = new URL(`http://localhost:3000/api/admin-proxy/${path}`);
  if (options.searchParams) {
    Object.entries(options.searchParams).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return new NextRequest(url, {
    method: options.method ?? 'GET',
    body: options.body,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}

function makeParams(pathSegments: string[]) {
  return { params: { path: pathSegments } };
}

function makeBackendResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  const headersMap = new Map(Object.entries({ 'content-type': 'application/json', ...headers }));
  return {
    ok: status >= 200 && status < 300,
    status,
    arrayBuffer: () => Promise.resolve(Buffer.from(JSON.stringify(body))),
    headers: {
      forEach: (cb: (value: string, key: string) => void) => headersMap.forEach(cb),
    },
  };
}

describe('admin-proxy route handlers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authentication guard', () => {
    it('returns 401 when no access token is stored', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      const req = createRequest('users');
      const res = await GET(req, makeParams(['users']));
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    it('does not call backend when token is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      const req = createRequest('users');
      await GET(req, makeParams(['users']));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('GET proxy', () => {
    it('forwards GET request to backend with Authorization header', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ items: [] }));

      const req = createRequest('users');
      await GET(req, makeParams(['users']));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/users'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        }),
      );
    });

    it('returns backend response status and body', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ id: 1, name: 'Test' }, 200));

      const req = createRequest('users/1');
      const res = await GET(req, makeParams(['users', '1']));

      expect(res.status).toBe(200);
    });

    it('constructs correct backend URL from path segments', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({}));

      const req = createRequest('admin/users/123/profile');
      await GET(req, makeParams(['admin', 'users', '123', 'profile']));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('admin/users/123/profile'),
        expect.anything(),
      );
    });

    it('forwards query string parameters to backend', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ items: [] }));

      const req = createRequest('users', { searchParams: { page: '2', limit: '20' } });
      await GET(req, makeParams(['users']));

      const calledUrl: string = mockFetch.mock.calls[0][0];
      expect(calledUrl).toContain('page=2');
      expect(calledUrl).toContain('limit=20');
    });

    it('does not include a body for GET requests', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({}));

      const req = createRequest('users');
      await GET(req, makeParams(['users']));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ body: null }),
      );
    });
  });

  describe('POST proxy with body', () => {
    it('forwards POST request with body and Content-Type header', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ id: 2 }, 201));

      const payload = JSON.stringify({ name: 'New User', email: 'new@test.com' });
      const req = createRequest('users', { method: 'POST', body: payload });
      const res = await POST(req, makeParams(['users']));

      expect(res.status).toBe(201);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer access-token',
          }),
        }),
      );
    });
  });

  describe('x-country header from session meta', () => {
    it('passes x-country header from session meta', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue({ ...validMeta, selectedCountry: 'jp' });

      mockFetch.mockResolvedValueOnce(makeBackendResponse({}));

      const req = createRequest('users');
      await GET(req, makeParams(['users']));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({ 'x-country': 'jp' }),
        }),
      );
    });

    it('does not include x-country header when session meta has no selectedCountry', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({}));

      const req = createRequest('users');
      await GET(req, makeParams(['users']));

      const calledHeaders = mockFetch.mock.calls[0][1].headers;
      expect(calledHeaders['x-country']).toBeUndefined();
    });
  });

  describe('HTTP method forwarding', () => {
    it('exports PUT handler that proxies PUT requests', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ updated: true }));

      const req = createRequest('users/1', { method: 'PUT', body: JSON.stringify({ name: 'Updated' }) });
      const res = await PUT(req, makeParams(['users', '1']));

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PUT' }));
      expect(res.status).toBe(200);
    });

    it('exports PATCH handler that proxies PATCH requests', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ patched: true }));

      const req = createRequest('users/1', { method: 'PATCH', body: JSON.stringify({ name: 'Patched' }) });
      const res = await PATCH(req, makeParams(['users', '1']));

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));
      expect(res.status).toBe(200);
    });

    it('exports DELETE handler that proxies DELETE requests', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(makeBackendResponse({ deleted: true }, 200));

      const req = createRequest('users/1', { method: 'DELETE' });
      const res = await DELETE(req, makeParams(['users', '1']));

      expect(mockFetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
      expect(res.status).toBe(200);
    });
  });

  describe('response header forwarding', () => {
    it('forwards Content-Disposition header from backend response', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce(
        makeBackendResponse({}, 200, { 'content-disposition': 'attachment; filename="report.csv"' }),
      );

      const req = createRequest('reports/export');
      const res = await GET(req, makeParams(['reports', 'export']));

      expect(res.headers.get('content-disposition')).toBe('attachment; filename="report.csv"');
    });
  });
});
