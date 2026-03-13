import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import {
  ADMIN_COOKIE_NAME,
  ADMIN_REFRESH_COOKIE_NAME,
  sessionOptions,
  type AdminSessionMeta,
} from './session-config';

export async function getAdminAccessToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_COOKIE_NAME)?.value ?? null;
}

export async function setAdminAccessToken(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8,
    path: '/',
  });
}

export async function getAdminRefreshToken(): Promise<string | null> {
  const cookieStore = cookies();
  return cookieStore.get(ADMIN_REFRESH_COOKIE_NAME)?.value ?? null;
}

export async function setAdminRefreshToken(token: string): Promise<void> {
  const cookieStore = cookies();
  cookieStore.set(ADMIN_REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });
}

export async function clearAdminCookies(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
  cookieStore.delete(ADMIN_REFRESH_COOKIE_NAME);
  cookieStore.delete(sessionOptions.cookieName);
}

export async function getSessionMeta(): Promise<AdminSessionMeta | null> {
  try {
    const cookieStore = cookies();
    const session = await getIronSession<AdminSessionMeta>(cookieStore, sessionOptions);
    if (!session.id) return null;
    return {
      id: session.id,
      email: session.email,
      roles: session.roles,
      issuedAt: session.issuedAt,
      selectedCountry: session.selectedCountry,
    };
  } catch {
    return null;
  }
}

export async function setSessionMeta(meta: AdminSessionMeta): Promise<void> {
  const cookieStore = cookies();
  const session = await getIronSession<AdminSessionMeta>(cookieStore, sessionOptions);
  session.id = meta.id;
  session.email = meta.email;
  session.roles = meta.roles;
  session.issuedAt = meta.issuedAt;
  session.selectedCountry = meta.selectedCountry;
  await session.save();
}
