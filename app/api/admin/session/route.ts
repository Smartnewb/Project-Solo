import { NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta, clearAdminCookies } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

export async function GET() {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token || !meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    // Validate token against backend
    const profileRes = await fetch(`${BACKEND_URL}/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      await clearAdminCookies();
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Return session DTO (meta from signed cookie, validated by backend)
    return NextResponse.json({
      user: {
        id: meta.id,
        email: meta.email,
        roles: meta.roles,
      },
      selectedCountry: meta.selectedCountry,
      issuedAt: meta.issuedAt,
    });
  } catch (error) {
    console.error('Session check error:', error);
    await clearAdminCookies();
    return NextResponse.json({ error: 'Session validation failed' }, { status: 401 });
  }
}
