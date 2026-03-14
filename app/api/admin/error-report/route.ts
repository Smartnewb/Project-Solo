import { NextRequest, NextResponse } from 'next/server';
import { adminLog } from '@/shared/lib/admin-logger';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, stack, componentStack, url, timestamp } = body;

    adminLog.error('/api/admin/error-report', 'client_error', new Error(message), {
      url,
      componentStack: componentStack?.slice(0, 200),
    });

    if (SLACK_WEBHOOK_URL) {
      await fetch(SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 *Admin Client Error*\n*Message:* ${message}\n*URL:* ${url}\n*Time:* ${timestamp}\n\`\`\`${stack?.slice(0, 500) || 'No stack'}\`\`\``,
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
