import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/') {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    const adminCookie = request.cookies.get('admin_session_meta');
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL('/', request.url));
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
