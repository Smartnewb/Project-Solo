import type { SessionOptions } from 'iron-session';

export const ADMIN_COOKIE_NAME = 'admin_access_token';
export const ADMIN_META_COOKIE = 'admin_session_meta';

export interface AdminSessionMeta {
  id: string;
  email: string;
  roles: string[];
  issuedAt: number;
  selectedCountry: string;
}

export interface AdminSessionData {
  accessToken: string;
  meta: AdminSessionMeta;
}

if (process.env.NODE_ENV === 'production' && !process.env.ADMIN_SESSION_SECRET) {
  throw new Error('ADMIN_SESSION_SECRET must be set in production');
}

export const sessionOptions: SessionOptions = {
  password: process.env.ADMIN_SESSION_SECRET || 'DEVELOPMENT_SECRET_MUST_BE_32_CHARS_LONG!!',
  cookieName: ADMIN_META_COOKIE,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
};
