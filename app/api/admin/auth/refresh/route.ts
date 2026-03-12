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

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST() {
  const currentToken = await getAdminAccessToken();
  const currentRefreshToken = await getAdminRefreshToken();
  const meta = await getSessionMeta();

  if (!currentToken || !currentRefreshToken || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const backendRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-country': meta.selectedCountry,
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!backendRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Refresh failed' }, { status: 401 });
    }

    const data = await backendRes.json();
    const newToken = data.accessToken;
    const newRefreshToken = data.refreshToken;

    if (!newToken) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'No token in refresh response' }, { status: 401 });
    }

    await setAdminAccessToken(newToken);
    if (typeof newRefreshToken === 'string' && newRefreshToken.length > 0) {
      await setAdminRefreshToken(newRefreshToken);
    }
    await setSessionMeta({ ...meta, issuedAt: Date.now() });

    return NextResponse.json({ accessToken: newToken });
  } catch (error) {
    console.error('Admin refresh error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Refresh error' }, { status: 500 });
  }
}
