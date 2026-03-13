import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public paths — always allow
  const publicPaths = ['/', '/signup', '/signup/test'];
  if (publicPaths.some((p) => pathname === p)) {
    return NextResponse.next();
  }

  // API routes — always allow (BFF handles its own auth)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Admin paths — require admin_session_meta cookie
  // Signature verification happens in route handlers; middleware checks existence only.
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get('admin_session_meta');
    if (!adminCookie) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // All other protected routes — check for legacy auth
  // (non-admin routes still use the old flow until later phases)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
