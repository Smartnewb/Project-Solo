import { NextRequest, NextResponse } from 'next/server';
import { getAdminAccessToken, getSessionMeta } from '@/shared/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8044/api';

// Allowlist of permitted path prefixes (SSRF prevention)
const ALLOWED_PATH_PREFIXES = [
	'admin/',
	'auth/',
	'users/',
	'user-gems/',
	'user-reports/',
	'user-appearance/',
	'universities/',
	'articles/',
	'public-reviews/',
	'app-reviews/',
	'stats/',
	'reports/',
	'dashboard/',
	'revenue/',
	'matching/',
];

function isPathAllowed(targetPath: string): boolean {
  return ALLOWED_PATH_PREFIXES.some((prefix) => targetPath === prefix.replace(/\/$/, '') || targetPath.startsWith(prefix));
}

async function proxyRequest(request: NextRequest, { params }: { params: { path: string[] } }) {
  const token = await getAdminAccessToken();
  const meta = await getSessionMeta();

  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const targetPath = params.path.join('/');

  if (!isPathAllowed(targetPath)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
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

  // Forward all backend response headers (Content-Disposition, Cache-Control, etc.)
  const responseHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    // Skip hop-by-hop headers that must not be forwarded
    if (lower === 'transfer-encoding' || lower === 'connection') return;
    responseHeaders.set(key, value);
  });

  // 204 No Content must not include a body
  const resBody = backendRes.status === 204 ? null : responseBody;

  return new NextResponse(resBody, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
