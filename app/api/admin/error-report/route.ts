import { NextRequest, NextResponse } from 'next/server';
import { adminLog } from '@/shared/lib/admin-logger';
import { getSessionMeta } from '@/shared/auth';

export async function POST(request: NextRequest) {
  const session = await getSessionMeta();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { message, componentStack, url } = body;

    adminLog.error('/api/admin/error-report', 'client_error', new Error(message), {
      url,
      componentStack: componentStack?.slice(0, 200),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
