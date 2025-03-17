import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  console.log('미들웨어 시작:', req.nextUrl.pathname);
  
  // 현재 URL 확인
  const { pathname } = req.nextUrl;
  
  // 무시할 경로 (API 경로 등)
  const ignorePaths = [
    '/api/', 
    '/_next/', 
    '/static/',
    '/favicon.ico',
    '.js',
    '.css',
    '.png',
    '.jpg',
    '.svg',
    '.ico'
  ];
  
  // 무시할 경로인 경우 바로 진행
  if (ignorePaths.some(path => pathname.includes(path))) {
    return NextResponse.next();
  }
  
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 디버깅용 로그
  console.log(`미들웨어 실행: 경로=${pathname}, 세션=${session ? '있음' : '없음'}`);

  // 인증이 필요한 경로 설정
  const authRequired = [
    '/home', 
    '/profile', 
    '/settings', 
    '/community',
    '/ideal-type'
  ];
  
  // 온보딩이 필요한 경로
  const setupPaths = [
    '/onboarding'
  ];
  
  // 인증 필요 없는 경로 설정
  const publicPaths = ['/', '/signup', '/login'];

  // 인증 필요한 페이지에 접근하는데 인증이 안 된 경우
  if (authRequired.some(path => pathname.startsWith(path)) && !session) {
    console.log('🚫 인증이 필요한 페이지에 인증되지 않은 접근:', pathname);
    const redirectUrl = new URL('/', req.url);
    console.log('리다이렉션 경로:', redirectUrl.href);
    return NextResponse.redirect(redirectUrl);
  }

  // 인증된 상태에서 로그인/회원가입 페이지 접근 시
  if (publicPaths.includes(pathname) && session) {
    console.log('🔄 이미 인증된 사용자가 인증 페이지에 접근:', pathname);
    const redirectUrl = new URL('/home', req.url);
    console.log('리다이렉션 경로:', redirectUrl.href);
    return NextResponse.redirect(redirectUrl);
  }

  console.log('미들웨어 정상 통과:', pathname);
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 