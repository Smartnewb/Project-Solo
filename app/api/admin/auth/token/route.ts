import { NextResponse } from 'next/server';
import { adminLog } from '@/shared/lib/admin-logger';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

export async function GET() {
  try {
    const token = await getAdminAccessToken();
    const meta = await getSessionMeta();

    if (!meta || !token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    return NextResponse.json({ accessToken: token });
  } catch (error) {
    adminLog.error('/api/admin/auth/token', 'token_fetch_failed', error);
    return NextResponse.json({ error: 'Token fetch failed' }, { status: 500 });
  }
}
