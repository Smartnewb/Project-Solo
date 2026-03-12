import { NextRequest, NextResponse } from 'next/server';
import { setAdminAccessToken, setSessionMeta } from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken || typeof accessToken !== 'string') {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const profileRes = await fetch(`${BACKEND_URL}/profile`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const profile = await profileRes.json();
    const roles: string[] = profile.roles || [];

    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await setAdminAccessToken(accessToken);

    const meta: AdminSessionMeta = {
      id: profile.id,
      email: profile.email,
      roles,
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    };
    await setSessionMeta(meta);

    return NextResponse.json({ success: true, user: profile });
  } catch (error) {
    console.error('Auth sync error:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
