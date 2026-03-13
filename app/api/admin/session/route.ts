import { NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta, clearAdminCookies } from '@/shared/auth';
import { extractRoles, isAdminRoleSet, type AdminIdentitySource } from '@/shared/auth/admin-session-user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function GET() {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const userRes = await fetch(`${BACKEND_URL}/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-country': meta.selectedCountry,
      },
    });

    if (!userRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const identity = (await userRes.json()) as AdminIdentitySource;
    const roles = extractRoles(identity);

    if (!isAdminRoleSet(roles)) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Return session DTO (meta from signed cookie, validated by backend)
    return NextResponse.json({
      user: {
        id: meta.id,
        email: meta.email,
        roles,
      },
      selectedCountry: meta.selectedCountry,
      issuedAt: meta.issuedAt,
    });
  } catch (error) {
    // eslint-disable-next-line no-console -- server-side route handler error logging
    console.error('Session check error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
  }
}
