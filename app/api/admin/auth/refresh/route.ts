import { NextResponse } from 'next/server';
import { getAdminAccessToken, setAdminAccessToken, getSessionMeta, setSessionMeta, clearAdminCookies } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST() {
  const currentToken = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!currentToken || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': 'kr',
        Authorization: `Bearer ${currentToken}`,
      },
    });

    if (!backendRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await backendRes.json();
    const newToken = data.accessToken;

    if (!newToken) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'No token in refresh response' }, { status: 401 });
    }

    await setAdminAccessToken(newToken);
    await setSessionMeta({ ...meta, issuedAt: Date.now() });

    return NextResponse.json({ accessToken: newToken });
  } catch (error) {
    console.error('Admin refresh error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Refresh error' }, { status: 500 });
  }
}
