import { NextRequest, NextResponse } from 'next/server';
import { setAdminAccessToken, setSessionMeta } from '@/shared/auth';
import type { AdminSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendRes = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!backendRes.ok) {
      const error = await backendRes.json().catch(() => ({ message: 'Login failed' }));
      return NextResponse.json(error, { status: backendRes.status });
    }

    const data = await backendRes.json();

    const roles: string[] = data.user?.roles || [];
    if (!roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await setAdminAccessToken(data.accessToken);

    const meta: AdminSessionMeta = {
      id: data.user.id,
      email: data.user.email,
      roles,
      issuedAt: Date.now(),
      selectedCountry: 'kr',
    };
    await setSessionMeta(meta);

    return NextResponse.json({
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
