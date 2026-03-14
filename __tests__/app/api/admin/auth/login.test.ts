/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';

// Must mock next/headers before importing the route
jest.mock('next/headers', () => ({ cookies: jest.fn() }));

jest.mock('@/shared/auth', () => ({
  normalizeAdminCountry: jest.fn((c: string) => c || 'kr'),
  setAdminAccessToken: jest.fn().mockResolvedValue(undefined),
  setAdminRefreshToken: jest.fn().mockResolvedValue(undefined),
  setSessionMeta: jest.fn().mockResolvedValue(undefined),
  getAdminAccessToken: jest.fn(),
  getAdminRefreshToken: jest.fn(),
  getSessionMeta: jest.fn(),
  clearAdminCookies: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/shared/auth/admin-session-user', () => ({
  extractRoles: jest.fn(),
  isAdminRoleSet: jest.fn(),
  buildAdminSessionUser: jest.fn(),
}));

import { POST } from '@/app/api/admin/auth/login/route';
import {
  setAdminAccessToken,
  setAdminRefreshToken,
  setSessionMeta,
  normalizeAdminCountry,
} from '@/shared/auth';
import {
  extractRoles,
  isAdminRoleSet,
  buildAdminSessionUser,
} from '@/shared/auth/admin-session-user';

const mockFetch = jest.fn();
global.fetch = mockFetch;

function createRequest(body: object): NextRequest {
  return new NextRequest('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeFetchResponse(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('POST /api/admin/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (normalizeAdminCountry as jest.Mock).mockImplementation((c: string) => c || 'kr');
  });

  describe('success case', () => {
    it('returns 200 with user and sets cookies when backend returns admin user', async () => {
      const loginData = {
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-abc',
        roles: ['admin'],
      };
      const identityData = { id: 'user-1', name: 'Admin User', email: 'admin@test.com', roles: ['admin'] };
      const detailsData = { email: 'admin@test.com' };
      const sessionUser = { id: 'user-1', email: 'admin@test.com', name: 'Admin User', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(identityData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(detailsData) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);
      (buildAdminSessionUser as jest.Mock).mockReturnValue(sessionUser);

      const req = createRequest({ email: 'admin@test.com', password: 'pass', selectedCountry: 'kr' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.accessToken).toBe('access-token-123');
      expect(body.user.id).toBe('user-1');
      expect(body.user.email).toBe('admin@test.com');
      expect(body.user.roles).toEqual(['admin']);
      expect(body.user.role).toBe('admin');
    });

    it('calls setAdminAccessToken with the backend access token', async () => {
      const loginData = { accessToken: 'access-token-123', refreshToken: 'refresh-token-abc', roles: ['admin'] };
      const identityData = { id: 'user-1', name: 'Admin', email: 'admin@test.com', roles: ['admin'] };
      const sessionUser = { id: 'user-1', email: 'admin@test.com', name: 'Admin', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(identityData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);
      (buildAdminSessionUser as jest.Mock).mockReturnValue(sessionUser);

      const req = createRequest({ email: 'admin@test.com', password: 'pass', selectedCountry: 'kr' });
      await POST(req);

      expect(setAdminAccessToken).toHaveBeenCalledWith('access-token-123');
    });

    it('calls setAdminRefreshToken when backend provides a refresh token', async () => {
      const loginData = { accessToken: 'access-token-123', refreshToken: 'refresh-token-abc', roles: ['admin'] };
      const identityData = { id: 'user-1', name: 'Admin', email: 'admin@test.com', roles: ['admin'] };
      const sessionUser = { id: 'user-1', email: 'admin@test.com', name: 'Admin', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(identityData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);
      (buildAdminSessionUser as jest.Mock).mockReturnValue(sessionUser);

      const req = createRequest({ email: 'admin@test.com', password: 'pass', selectedCountry: 'kr' });
      await POST(req);

      expect(setAdminRefreshToken).toHaveBeenCalledWith('refresh-token-abc');
    });

    it('calls setSessionMeta with user id, email, roles, and selectedCountry', async () => {
      const loginData = { accessToken: 'access-token-123', refreshToken: 'rt', roles: ['admin'] };
      const identityData = { id: 'user-1', name: 'Admin', email: 'admin@test.com', roles: ['admin'] };
      const sessionUser = { id: 'user-1', email: 'admin@test.com', name: 'Admin', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(identityData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);
      (buildAdminSessionUser as jest.Mock).mockReturnValue(sessionUser);

      const req = createRequest({ email: 'admin@test.com', password: 'pass', selectedCountry: 'kr' });
      await POST(req);

      expect(setSessionMeta).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user-1',
          email: 'admin@test.com',
          roles: ['admin'],
          selectedCountry: 'kr',
        }),
      );
    });

    it('does not call setAdminRefreshToken when backend provides no refresh token', async () => {
      const loginData = { accessToken: 'access-token-123', roles: ['admin'] };
      const identityData = { id: 'user-1', name: 'Admin', email: 'admin@test.com', roles: ['admin'] };
      const sessionUser = { id: 'user-1', email: 'admin@test.com', name: 'Admin', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(identityData) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);
      (buildAdminSessionUser as jest.Mock).mockReturnValue(sessionUser);

      const req = createRequest({ email: 'admin@test.com', password: 'pass' });
      await POST(req);

      expect(setAdminRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('non-admin user', () => {
    it('returns 403 when backend returns user without admin role', async () => {
      const loginData = { accessToken: 'token', refreshToken: 'rt', roles: ['user'] };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(loginData),
      });

      (extractRoles as jest.Mock).mockReturnValue(['user']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(false);

      const req = createRequest({ email: 'user@test.com', password: 'pass' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Admin access required');
    });

    it('returns 403 when user has no roles', async () => {
      const loginData = { accessToken: 'token', refreshToken: 'rt' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(loginData),
      });

      (extractRoles as jest.Mock).mockReturnValue([]);
      (isAdminRoleSet as jest.Mock).mockReturnValue(false);

      const req = createRequest({ email: 'user@test.com', password: 'pass' });
      const res = await POST(req);

      expect(res.status).toBe(403);
    });
  });

  describe('invalid credentials', () => {
    it('returns 401 when backend returns 401', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' }),
      });

      const req = createRequest({ email: 'admin@test.com', password: 'wrong' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.message).toBe('Invalid credentials');
    });

    it('forwards the exact status code from the backend on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: () => Promise.resolve({ message: 'Validation error' }),
      });

      const req = createRequest({ email: 'bad-email', password: '' });
      const res = await POST(req);

      expect(res.status).toBe(422);
    });

    it('returns 500 on unexpected internal error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('network failure'));

      const req = createRequest({ email: 'admin@test.com', password: 'pass' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Internal server error');
    });
  });

  describe('identity fetch failure', () => {
    it('returns 502 when user identity fetch fails after successful login', async () => {
      const loginData = { accessToken: 'token', refreshToken: 'rt', roles: ['admin'] };

      mockFetch
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve(loginData) })
        .mockResolvedValueOnce({ ok: false, status: 500, json: () => Promise.resolve({}) })
        .mockResolvedValueOnce({ ok: true, status: 200, json: () => Promise.resolve({}) });

      (extractRoles as jest.Mock).mockReturnValue(['admin']);
      (isAdminRoleSet as jest.Mock).mockReturnValue(true);

      const req = createRequest({ email: 'admin@test.com', password: 'pass' });
      const res = await POST(req);
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body.error).toBe('Failed to fetch admin identity');
    });
  });
});
