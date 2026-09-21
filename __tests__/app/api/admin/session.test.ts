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

jest.mock('@/shared/auth/admin-session-user', () => ({
  extractRoles: jest.fn(),
  isAdminRoleSet: jest.fn(),
  buildAdminSessionUser: jest.fn(),
}));

import { GET } from '@/app/api/admin/session/route';
import {
  getAdminAccessToken,
  getAdminRefreshToken,
  setAdminAccessToken,
  setAdminRefreshToken,
  getSessionMeta,
  setSessionMeta,
  clearAdminCookies,
} from '@/shared/auth';
import { extractRoles, isAdminRoleSet } from '@/shared/auth/admin-session-user';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const validMeta = {
  id: 'user-1',
  email: 'admin@test.com',
  roles: ['admin'],
  issuedAt: Date.now() - 1000,
  selectedCountry: 'kr',
};

const adminIdentity = { id: 'user-1', email: 'admin@test.com', name: 'Admin', roles: ['admin'] };

describe('GET /api/admin/session', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('valid session', () => {
    it('returns 200 with session DTO when token is valid and user is admin', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('valid-access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(adminIdentity),
      });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user).toEqual({ id: 'user-1', email: 'admin@test.com', roles: ['admin'] });
      expect(body.selectedCountry).toBe('kr');
      expect(body.issuedAt).toBeDefined();
    });

    it('includes selectedCountry and issuedAt in the session DTO', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('valid-access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(adminIdentity),
      });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      const res = await GET();
      const body = await res.json();

      expect(body.selectedCountry).toBe('kr');
      expect(typeof body.issuedAt).toBe('number');
    });
  });

  describe('no session meta', () => {
    it('returns 401 when session meta is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('valid-access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Not authenticated');
    });

    it('does not call backend when session meta is missing', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('valid-access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(null);

      await GET();

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('non-admin user', () => {
    it('returns 403 and clears cookies when backend says user lost admin role', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('valid-access-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'user-1', roles: ['user'] }),
      });

      (extractRoles as jest.Mock).mockReturnValue(['user']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(false);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });

  describe('expired token with successful silent refresh', () => {
    it('returns 200 with session DTO after silent refresh succeeds', async () => {
      // No access token — triggers silent refresh path
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      // Backend refresh call
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token' }),
        })
        // /user validation call after refresh
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(adminIdentity),
        });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.user).toBeDefined();
    });

    it('sets new access token cookie after successful silent refresh', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ accessToken: 'new-access-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(adminIdentity),
        });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      await GET();

      expect(setAdminAccessToken).toHaveBeenCalledWith('new-access-token');
    });

    it('updates session meta issuedAt after silent refresh', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('valid-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ accessToken: 'new-access-token' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(adminIdentity),
        });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      await GET();

      expect(setSessionMeta).toHaveBeenCalledWith(
        expect.objectContaining({ issuedAt: expect.any(Number) }),
      );
    });
  });

  describe('fully expired — no refresh token', () => {
    it('returns 401 and clears cookies when no refresh token is available', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Session expired');
      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });

  describe('refresh token rejected by backend', () => {
    it('returns 401 and clears cookies when backend rejects the refresh token', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('expired-refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Token expired' }),
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Session expired');
      expect(clearAdminCookies).toHaveBeenCalled();
    });

    it('returns 401 and clears cookies when refresh response contains no accessToken', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue(null);
      (getAdminRefreshToken as jest.Mock).mockResolvedValue('refresh-token');
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ refreshToken: 'something' }),
      });

      const res = await GET();
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Session expired');
      expect(clearAdminCookies).toHaveBeenCalled();
    });
  });

  describe('access token present but /user fetch fails', () => {
    it('falls through to silent refresh when /user fetch returns non-ok', async () => {
      (getAdminAccessToken as jest.Mock).mockResolvedValue('stale-access-token');
      (getAdminRefreshToken as jest.Mock).mockResolvedValue(null);
      (getSessionMeta as jest.Mock).mockResolvedValue(validMeta);

      // /user fails — will fall through to refresh path; no refresh token → 401
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({}),
      });

      const res = await GET();

      expect(res.status).toBe(401);
    });
  });
});
