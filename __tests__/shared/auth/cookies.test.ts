// Mock next/headers and iron-session before any imports
const mockGet = jest.fn();
const mockSet = jest.fn();
const mockDelete = jest.fn();
const mockCookies = jest.fn(() => ({ get: mockGet, set: mockSet, delete: mockDelete }));

jest.mock('next/headers', () => ({ cookies: mockCookies }));

const mockSessionSave = jest.fn().mockResolvedValue(undefined);
const mockGetIronSession = jest.fn();

jest.mock('iron-session', () => ({ getIronSession: mockGetIronSession }), { virtual: true });

// Mock session-config to use a fixed cookie name
jest.mock('@/shared/auth/session-config', () => ({
  ADMIN_COOKIE_NAME: 'admin_access_token',
  ADMIN_REFRESH_COOKIE_NAME: 'admin_refresh_token',
  sessionOptions: {
    password: 'DEVELOPMENT_SECRET_MUST_BE_32_CHARS_LONG!!',
    cookieName: 'admin_session_meta',
    cookieOptions: { secure: false, httpOnly: true, sameSite: 'lax', maxAge: 28800 },
  },
}));

import {
  getAdminAccessToken,
  setAdminAccessToken,
  getAdminRefreshToken,
  setAdminRefreshToken,
  clearAdminCookies,
  getSessionMeta,
  setSessionMeta,
} from '@/shared/auth/cookies';

describe('shared/auth/cookies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCookies.mockReturnValue({ get: mockGet, set: mockSet, delete: mockDelete });
  });

  describe('getAdminAccessToken', () => {
    it('returns the token value when the cookie exists', async () => {
      mockGet.mockReturnValue({ value: 'my-access-token' });

      const token = await getAdminAccessToken();

      expect(token).toBe('my-access-token');
      expect(mockGet).toHaveBeenCalledWith('admin_access_token');
    });

    it('returns null when the access token cookie does not exist', async () => {
      mockGet.mockReturnValue(undefined);

      const token = await getAdminAccessToken();

      expect(token).toBeNull();
    });
  });

  describe('setAdminAccessToken', () => {
    it('sets the access token cookie with httpOnly and lax sameSite', async () => {
      await setAdminAccessToken('new-access-token');

      expect(mockSet).toHaveBeenCalledWith(
        'admin_access_token',
        'new-access-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
    });

    it('sets the access token cookie with 8-hour maxAge', async () => {
      await setAdminAccessToken('new-access-token');

      expect(mockSet).toHaveBeenCalledWith(
        'admin_access_token',
        'new-access-token',
        expect.objectContaining({ maxAge: 60 * 60 * 8 }),
      );
    });
  });

  describe('getAdminRefreshToken', () => {
    it('returns the refresh token value when the cookie exists', async () => {
      mockGet.mockReturnValue({ value: 'my-refresh-token' });

      const token = await getAdminRefreshToken();

      expect(token).toBe('my-refresh-token');
      expect(mockGet).toHaveBeenCalledWith('admin_refresh_token');
    });

    it('returns null when the refresh token cookie does not exist', async () => {
      mockGet.mockReturnValue(undefined);

      const token = await getAdminRefreshToken();

      expect(token).toBeNull();
    });
  });

  describe('setAdminRefreshToken', () => {
    it('sets the refresh token cookie with 7-day maxAge', async () => {
      await setAdminRefreshToken('new-refresh-token');

      expect(mockSet).toHaveBeenCalledWith(
        'admin_refresh_token',
        'new-refresh-token',
        expect.objectContaining({ maxAge: 7 * 24 * 60 * 60 }),
      );
    });

    it('sets the refresh token cookie with httpOnly and lax sameSite', async () => {
      await setAdminRefreshToken('new-refresh-token');

      expect(mockSet).toHaveBeenCalledWith(
        'admin_refresh_token',
        'new-refresh-token',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        }),
      );
    });
  });

  describe('clearAdminCookies', () => {
    it('deletes the access token cookie', async () => {
      await clearAdminCookies();

      expect(mockDelete).toHaveBeenCalledWith('admin_access_token');
    });

    it('deletes the refresh token cookie', async () => {
      await clearAdminCookies();

      expect(mockDelete).toHaveBeenCalledWith('admin_refresh_token');
    });

    it('deletes the session meta cookie', async () => {
      await clearAdminCookies();

      expect(mockDelete).toHaveBeenCalledWith('admin_session_meta');
    });

    it('deletes all three cookies in a single call', async () => {
      await clearAdminCookies();

      expect(mockDelete).toHaveBeenCalledTimes(3);
    });
  });

  describe('getSessionMeta', () => {
    it('returns the session meta when session has a valid id', async () => {
      const meta = {
        id: 'user-1',
        email: 'admin@test.com',
        roles: ['admin'],
        issuedAt: 1234567890,
        selectedCountry: 'kr',
        save: mockSessionSave,
      };
      mockGetIronSession.mockResolvedValue(meta);

      const result = await getSessionMeta();

      expect(result).toEqual({
        id: 'user-1',
        email: 'admin@test.com',
        roles: ['admin'],
        issuedAt: 1234567890,
        selectedCountry: 'kr',
      });
    });

    it('returns null when session has no id', async () => {
      mockGetIronSession.mockResolvedValue({ save: mockSessionSave });

      const result = await getSessionMeta();

      expect(result).toBeNull();
    });

    it('returns null when getIronSession throws an error', async () => {
      mockGetIronSession.mockRejectedValue(new Error('session error'));

      const result = await getSessionMeta();

      expect(result).toBeNull();
    });

    it('returns null when session id is empty string', async () => {
      mockGetIronSession.mockResolvedValue({ id: '', save: mockSessionSave });

      const result = await getSessionMeta();

      expect(result).toBeNull();
    });
  });

  describe('setSessionMeta', () => {
    it('saves all meta fields to the iron session', async () => {
      const session = {
        id: undefined as string | undefined,
        email: undefined as string | undefined,
        roles: undefined as string[] | undefined,
        issuedAt: undefined as number | undefined,
        selectedCountry: undefined as string | undefined,
        save: mockSessionSave,
      };
      mockGetIronSession.mockResolvedValue(session);

      const meta = {
        id: 'user-1',
        email: 'admin@test.com',
        roles: ['admin'],
        issuedAt: 1234567890,
        selectedCountry: 'kr',
      };

      await setSessionMeta(meta);

      expect(session.id).toBe('user-1');
      expect(session.email).toBe('admin@test.com');
      expect(session.roles).toEqual(['admin']);
      expect(session.issuedAt).toBe(1234567890);
      expect(session.selectedCountry).toBe('kr');
    });

    it('calls session.save() after writing meta fields', async () => {
      const session = {
        id: undefined as string | undefined,
        email: undefined as string | undefined,
        roles: undefined as string[] | undefined,
        issuedAt: undefined as number | undefined,
        selectedCountry: undefined as string | undefined,
        save: mockSessionSave,
      };
      mockGetIronSession.mockResolvedValue(session);

      await setSessionMeta({
        id: 'user-1',
        email: 'admin@test.com',
        roles: ['admin'],
        issuedAt: 1234567890,
        selectedCountry: 'kr',
      });

      expect(mockSessionSave).toHaveBeenCalled();
    });
  });
});
