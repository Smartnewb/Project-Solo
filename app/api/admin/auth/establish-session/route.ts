import { NextRequest, NextResponse } from 'next/server';
import {
  normalizeAdminCountry,
  setAdminAccessToken,
  setAdminRefreshToken,
  setSessionMeta,
} from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';
import {
  extractRoles,
  isAdminRoleSet,
  type AdminIdentitySource,
} from '@/shared/auth/admin-session-user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, refreshToken } = body;

    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'accessToken required' }, { status: 400 });
    }

    const selectedCountry = normalizeAdminCountry(body.selectedCountry);

    const userRes = await fetch(`${BACKEND_URL}/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'x-country': selectedCountry,
      },
    });

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const identity = (await userRes.json()) as AdminIdentitySource;
    const roles = extractRoles(identity);

    if (!isAdminRoleSet(roles)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await setAdminAccessToken(accessToken);
    if (typeof refreshToken === 'string' && refreshToken.length > 0) {
      await setAdminRefreshToken(refreshToken);
    }

    const meta: AdminSessionMeta = {
      id: identity.id || '',
      email: identity.email || '',
      roles,
      issuedAt: Date.now(),
      selectedCountry,
    };
    await setSessionMeta(meta);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Establish session error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
