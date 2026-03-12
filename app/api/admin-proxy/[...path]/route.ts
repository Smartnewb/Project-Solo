import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const targetPath = params.path.join('/');
  const url = new URL(`${BACKEND_URL}/${targetPath}`);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };

  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  if (meta?.selectedCountry) {
    headers['x-country'] = meta.selectedCountry;
  }

  let body: BodyInit | null = null;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.arrayBuffer();
  }

  const backendRes = await fetch(url.toString(), {
    method: request.method,
    headers,
    body,
  });

  const responseBody = await backendRes.arrayBuffer();
  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: {
      'Content-Type': backendRes.headers.get('Content-Type') || 'application/json',
    },
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
