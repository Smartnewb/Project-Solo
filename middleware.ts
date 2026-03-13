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

  // Admin paths — allow through, AdminShell handles auth
  // Phase 1: Permissive. AdminShell validates session (cookie-first, localStorage-fallback).
  // Phase 6: Middleware will enforce cookie presence.
  if (pathname.startsWith('/admin')) {
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
