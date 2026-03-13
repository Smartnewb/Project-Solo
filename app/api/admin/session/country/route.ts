import { NextRequest, NextResponse } from 'next/server';
import { getSessionMeta, setSessionMeta } from '@/shared/auth';

export async function POST(request: NextRequest) {
  const meta = await getSessionMeta();
  if (!meta) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const { country } = await request.json();
  if (!country || typeof country !== 'string') {
    return NextResponse.json({ error: 'Invalid country' }, { status: 400 });
  }

  await setSessionMeta({ ...meta, selectedCountry: country });
  return NextResponse.json({ selectedCountry: country });
}
