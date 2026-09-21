import { NextRequest, NextResponse } from 'next/server';
import { getSessionMeta, normalizeAdminCountry, setSessionMeta } from '@/shared/auth';
import { isSameOrigin } from '@/shared/lib/csrf';

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const meta = await getSessionMeta();
  if (!meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { country } = await request.json();
  if (!country || typeof country !== 'string') {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }

  const selectedCountry = normalizeAdminCountry(country);
  await setSessionMeta({ ...meta, selectedCountry });
  return NextResponse.json({ selectedCountry });
}
