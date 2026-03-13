import { NextResponse } from 'next/server';
import {
  getAdminAccessToken,
  getAdminRefreshToken,
  setAdminAccessToken,
  setAdminRefreshToken,
  getSessionMeta,
  setSessionMeta,
  clearAdminCookies,
} from '@/shared/auth';
import { extractRoles, isAdminRoleSet, type AdminIdentitySource } from '@/shared/auth/admin-session-user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

async function fetchUserAndBuildSessionDTO(
  token: string,
  meta: Awaited<ReturnType<typeof getSessionMeta>>,
) {
  if (!meta) return null;

  const userRes = await fetch(`${BACKEND_URL}/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'x-country': meta.selectedCountry,
    },
  });

  if (!userRes.ok) return null;

  const identity = (await userRes.json()) as AdminIdentitySource;
  const roles = extractRoles(identity);

  if (!isAdminRoleSet(roles)) {
    return { forbidden: true as const };
  }

  return {
    user: {
      id: meta.id,
      email: meta.email,
      roles,
    },
    selectedCountry: meta.selectedCountry,
    issuedAt: meta.issuedAt,
  };
}

export async function GET() {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    if (token) {
      const sessionDTO = await fetchUserAndBuildSessionDTO(token, meta);

      if (sessionDTO && 'forbidden' in sessionDTO) {
        await clearAdminCookies();
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      if (sessionDTO) {
        return NextResponse.json(sessionDTO);
      }
    }

    // Access token missing or expired — attempt silent refresh
    const refreshToken = await getAdminRefreshToken();

    if (!refreshToken) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': meta.selectedCountry,
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!refreshRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const refreshData = await refreshRes.json();
    const newAccessToken: string = refreshData.accessToken;
    const newRefreshToken: string | undefined = refreshData.refreshToken;

    if (!newAccessToken) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    await setAdminAccessToken(newAccessToken);
    if (typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
      await setAdminRefreshToken(newRefreshToken);
    }
    await setSessionMeta({ ...meta, issuedAt: Date.now() });

    const sessionDTO = await fetchUserAndBuildSessionDTO(newAccessToken, meta);

    if (!sessionDTO) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
    }

    if ('forbidden' in sessionDTO) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    return NextResponse.json(sessionDTO);
  } catch (error) {
    // eslint-disable-next-line no-console -- server-side route handler error logging
    console.error('Session check error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
  }
}
