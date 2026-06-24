import { NextRequest, NextResponse } from 'next/server';
import {
  clearAdminCookies,
  getAdminAccessToken,
  getAdminRefreshToken,
} from '@/shared/auth';
import { isSameOrigin } from '@/shared/lib/csrf';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  const accessToken = await getAdminAccessToken();
  const storedRefreshToken = await getAdminRefreshToken();
  const body = await request.json().catch(() => null);
  const refreshToken = body?.refreshToken ?? storedRefreshToken;

  if (accessToken && refreshToken) {
    await fetch(`${BACKEND_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  await clearAdminCookies();
  return NextResponse.json({ success: true });
}
