describe('shared/auth/session-config', () => {
  const ORIGINAL_ENV = process.env;
  const setNodeEnv = (value: string) => {
    (process.env as Record<string, string | undefined>).NODE_ENV = value;
  };

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('constants', () => {
    it('exports ADMIN_COOKIE_NAME as admin_access_token', async () => {
      const { ADMIN_COOKIE_NAME } = await import('@/shared/auth/session-config');
      expect(ADMIN_COOKIE_NAME).toBe('admin_access_token');
    });

    it('exports ADMIN_REFRESH_COOKIE_NAME as admin_refresh_token', async () => {
      const { ADMIN_REFRESH_COOKIE_NAME } = await import('@/shared/auth/session-config');
      expect(ADMIN_REFRESH_COOKIE_NAME).toBe('admin_refresh_token');
    });

    it('exports ADMIN_META_COOKIE as admin_session_meta', async () => {
      const { ADMIN_META_COOKIE } = await import('@/shared/auth/session-config');
      expect(ADMIN_META_COOKIE).toBe('admin_session_meta');
    });
  });

  describe('sessionOptions', () => {
    it('uses admin_session_meta as the cookie name', async () => {
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.cookieName).toBe('admin_session_meta');
    });

    it('sets httpOnly to true in cookie options', async () => {
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.cookieOptions?.httpOnly).toBe(true);
    });

    it('sets sameSite to lax in cookie options', async () => {
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.cookieOptions?.sameSite).toBe('lax');
    });

    it('sets maxAge to 8 hours (28800 seconds)', async () => {
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.cookieOptions?.maxAge).toBe(60 * 60 * 8);
    });

    it('returns development fallback secret when ADMIN_SESSION_SECRET is not set in non-production', async () => {
      delete process.env.ADMIN_SESSION_SECRET;
      setNodeEnv('test');
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.password).toBe('DEVELOPMENT_SECRET_MUST_BE_32_CHARS_LONG!!');
    });

    it('returns ADMIN_SESSION_SECRET when it is set', async () => {
      process.env.ADMIN_SESSION_SECRET = 'my-custom-secret-that-is-32-chars!';
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.password).toBe('my-custom-secret-that-is-32-chars!');
    });

    it('throws when ADMIN_SESSION_SECRET is missing in production', async () => {
      delete process.env.ADMIN_SESSION_SECRET;
      setNodeEnv('production');
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(() => sessionOptions.password).toThrow('ADMIN_SESSION_SECRET must be set in production');
    });

    it('sets secure to false in non-production', async () => {
      setNodeEnv('test');
      const { sessionOptions } = await import('@/shared/auth/session-config');
      expect(sessionOptions.cookieOptions?.secure).toBe(false);
    });
  });
});
