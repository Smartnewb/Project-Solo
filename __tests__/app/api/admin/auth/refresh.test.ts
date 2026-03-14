/**
 * @jest-environment node
 */
// Must mock next/headers before importing the route
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
  getAdminAccessToken: jest.fn(),
  getAdminRefreshToken: jest.fn(),
  setAdminAccessToken: jest.fn().mockResolvedValue(undefined),
  setAdminRefreshToken: jest.fn().mockResolvedValue(undefined),
  getSessionMeta: jest.fn(),
  setSessionMeta: jest.fn().mockResolvedValue(undefined),
  clearAdminCookies: jest.fn().mockResolvedValue(undefined),
  normalizeAdminCountry: jest.fn((c: string) => c || 'kr'),
}));

import { POST } from '@/app/api/admin/auth/refresh/route';
import {
  getAdminAccessToken,
  getAdminRefreshToken,
  getSessionMeta,
  setAdminAccessToken,
  setAdminRefreshToken,
  setSessionMeta,
  clearAdminCookies,
} from '@/shared/auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const validMeta = {
  id: 'user-1',
  email: 'admin@test.com',
  roles: ['admin'],
  issuedAt: Date.now(),
  selectedCountry: 'kr',
};

describe('POST /api/admin/auth/refresh', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns 200 with new accessToken when refresh succeeds', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
      });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.accessToken).toBe('new-access-token');
    });

    it('sets new access token cookie after successful refresh', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
      });

      await POST();

      expect(setAdminAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    it('sets new refresh token cookie when backend provides one', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
      });

      await POST();

      expect(setAdminRefreshToken).toHaveBeenCalledWith('new-refresh-token');
    });

    it('updates session meta issuedAt after successful refresh', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access-token' }),
      });

      await POST();

      expect(setSessionMeta).toHaveBeenCalledWith(
        expect.objectContaining({
          id: validMeta.id,
          email: validMeta.email,
          issuedAt: expect.any(Number),
        }),
      );
    });

    it('does not call setAdminRefreshToken when backend provides no refresh token', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ accessToken: 'new-access-token' }),
      });

      await POST();

      expect(setAdminRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('missing authentication', () => {
    it('returns 401 when access token is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    it('returns 401 when refresh token is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    it('returns 401 when session meta is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    it('does not call backend when tokens are missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      await POST();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('backend refresh failure', () => {
    it('returns 401 and clears cookies when backend refresh fails', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Token expired' }),
      });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Refresh failed');
      expect(clearAdminCookies).toHaveBeenCalled();
    });

    it('returns 401 and clears cookies when backend returns no accessToken in response', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ refreshToken: 'some-token' }),
      });

      const res = await POST();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('No token in refresh response');
      expect(clearAdminCookies).toHaveBeenCalled();
    });

    it('clears cookies and returns 500 when fetch throws', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('old-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('old-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockRejectedValueOnce(new Error('network error'));

      const res = await POST();

      expect(res.status).toBe(500);
      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });
});
