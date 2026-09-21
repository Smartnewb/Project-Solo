import { NextResponse, type NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type AdminSessionMeta } from './shared/auth/session-config';
import { buildContentSecurityPolicy } from './shared/lib/csp';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const csp = buildContentSecurityPolicy();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('content-security-policy', csp);

  const nextWithCsp = () => {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    res.headers.set('Content-Security-Policy', csp);
    return res;
  };

  if (pathname === '/') {
    return nextWithCsp();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    // 쿠키 존재 여부가 아니라 iron-session 암호(AES-GCM + 서명)를 실제로
    // 복호화/검증한다. 임의 값(admin_session_meta=x)은 복호화 실패 → redirect.
    const response = nextWithCsp();
    const session = await getIronSession<AdminSessionMeta>(request, response, sessionOptions);

    if (!session.id) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
