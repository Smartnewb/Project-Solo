import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAIL } from '@/utils/config';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const publicPaths = ['/', '/signup', '/api/admin/signup-control', '/signup/test'];
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith('/api/'));
  const isAdminPath = pathname.startsWith('/admin');

  // 공개 경로는 통과
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 임시: 모든 protected 라우트 허용 (개발 중에만 사용)
  return NextResponse.next();

  /* 백엔드 API 준비되면 아래 코드 주석 해제
  // Authorization 헤더 확인
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }

  const accessToken = authHeader.split(' ')[1];

  // 토큰이 있을 경우, 백엔드에서 유저 정보 요청
  try {
    const userInfo = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }).then(res => res.ok ? res.json() : null);

    if (!userInfo) {
      // accessToken이 만료됐거나 잘못된 경우
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    if (isAdminPath && userInfo.email !== ADMIN_EMAIL) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/home';
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error('Auth check error:', error);
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = '/';
    return NextResponse.redirect(redirectUrl);
  }
  */
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
