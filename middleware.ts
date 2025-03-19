import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_EMAIL = 'notify@smartnewb.com';

// 토큰 새로고침이 빈번하게 일어나지 않도록 최적화된 미들웨어
export async function middleware(request: NextRequest) {
  // 정적 자원 및 API 요청은 무시
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico') ||
    request.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  
  // 현재 페이지가 무엇인지 로그로 기록
  console.log('미들웨어 접근 경로:', pathname);
  
  try {
    // 응답 객체 생성
    let response = NextResponse.next({
      request,
    });
    
    // Supabase 클라이언트 생성
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({
                name, 
                value,
                ...options
              });
            });
            
            response = NextResponse.next({
              request,
            });
            
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set({
                name, 
                value,
                ...options
              });
            });
          },
        },
      }
    );
    
    // 중요: CSRF 보호 및 토큰 새로고침
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('미들웨어 사용자 확인 오류:', userError);
      if (pathname === '/' || pathname === '/signup') {
        return response;
      } else {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    
    const isLoggedIn = !!user;
    
    // 인증 정보 로그
    console.log('인증 상태:', isLoggedIn ? 'Authenticated' : 'Not authenticated');
    
    // 인증이 필요한 경로에 대한 접근 제어
    if ((pathname.startsWith('/home') || pathname.startsWith('/profile') || pathname.startsWith('/onboarding')) && !isLoggedIn) {
      console.log('인증 필요 경로 접근 거부:', pathname);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // 로그인 상태에서 루트 페이지 접근 시 홈으로 리디렉션
    if (pathname === '/' && isLoggedIn) {
      console.log('로그인 사용자의 루트 페이지 접근, 홈으로 리디렉션');
      return NextResponse.redirect(new URL('/home', request.url));
    }
    
    return response;
  } catch (error) {
    console.error('미들웨어 오류:', error);
    // 오류 발생 시 기본 응답 반환
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/',
    '/home',
    '/home/:path*',
    '/admin/:path*',
    '/onboarding',
    '/onboarding/:path*',
  ],
}; 