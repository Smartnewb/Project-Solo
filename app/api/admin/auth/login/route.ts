import { NextRequest, NextResponse } from 'next/server';
import { setAdminAccessToken, setAdminRefreshToken, setSessionMeta } from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';
import {
  buildAdminSessionUser,
  extractRoles,
  isAdminRoleSet,
  type AdminIdentitySource,
} from '@/shared/auth/admin-session-user';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'kr',
      },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();

    const roles = extractRoles(data);
    if (!isAdminRoleSet(roles)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [userRes, detailsRes] = await Promise.all([
      fetch(`${BACKEND_URL}/user`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
          'x-country': 'kr',
        },
      }),
      fetch(`${BACKEND_URL}/user/details`, {
        headers: {
          Authorization: `Bearer ${data.accessToken}`,
          'x-country': 'kr',
        },
      }),
    ]);

    if (!userRes.ok) {
      return NextResponse.json({ error: 'Failed to fetch admin identity' }, { status: 502 });
    }

    const identity = (await userRes.json()) as AdminIdentitySource;
    const details = detailsRes.ok ? ((await detailsRes.json()) as AdminIdentitySource) : null;
    const sessionUser = buildAdminSessionUser(identity, details, body.email);

    await setAdminAccessToken(data.accessToken);
    if (typeof data.refreshToken === 'string' && data.refreshToken.length > 0) {
      await setAdminRefreshToken(data.refreshToken);
    }

    const meta: AdminSessionMeta = {
      id: sessionUser.id,
      email: sessionUser.email,
      roles: sessionUser.roles,
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    };
    await setSessionMeta(meta);

    return NextResponse.json({
      accessToken: data.accessToken,
      user: {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        roles: sessionUser.roles,
        role: sessionUser.roles[0] || 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
