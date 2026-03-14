/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Must mock next/headers before importing the route
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
  getAdminAccessToken: jest.fn(),
  getAdminRefreshToken: jest.fn(),
  clearAdminCookies: jest.fn().mockResolvedValue(undefined),
  normalizeAdminCountry: jest.fn((c: string) => c || 'kr'),
  setAdminAccessToken: jest.fn(),
  setAdminRefreshToken: jest.fn(),
  getSessionMeta: jest.fn(),
  setSessionMeta: jest.fn(),
}));

import { POST } from '@/app/api/admin/auth/logout/route';
import { getAdminAccessToken, getAdminRefreshToken, clearAdminCookies } from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createRequest(body?: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/auth/logout', {
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('POST /api/admin/auth/logout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({}) });
  });

  describe('success with tokens present', () => {
    it('returns { success: true } with status 200', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      const req = createRequest({});
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it('calls backend logout with Authorization header when tokens exist', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('stored-refresh-token');

      const req = createRequest({});
      await POST(req);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer access-token',
          }),
        }),
      );
    });

    it('uses refresh token from request body when provided', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('stored-refresh-token');

      const req = createRequest({ refreshToken: 'body-refresh-token' });
      await POST(req);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: 'body-refresh-token' }),
        }),
      );
    });

    it('falls back to stored refresh token when request body has no refreshToken', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('stored-refresh-token');

      const req = createRequest({});
      await POST(req);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({ refreshToken: 'stored-refresh-token' }),
        }),
      );
    });

    it('always clears admin cookies after successful backend logout', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      const req = createRequest({});
      await POST(req);

      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });

  describe('no tokens present', () => {
    it('returns { success: true } even when no tokens are stored', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);

      const req = createRequest({});
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it('does not call backend when access token is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      const req = createRequest({});
      await POST(req);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('does not call backend when refresh token is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);

      const req = createRequest({});
      await POST(req);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('still clears cookies when no tokens are stored', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);

      const req = createRequest({});
      await POST(req);

      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });

  describe('backend logout failure', () => {
    it('still returns { success: true } when backend logout call fails', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      mockFetch.mockRejectedValueOnce(new Error('network failure'));

      const req = createRequest({});
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toEqual({ success: true });
    });

    it('still clears cookies even when backend logout throws', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');

      mockFetch.mockRejectedValueOnce(new Error('network failure'));

      const req = createRequest({});
      await POST(req);

      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });
});
