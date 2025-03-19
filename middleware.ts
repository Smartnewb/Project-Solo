import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_EMAIL = 'notify@smartnewb.com';

// 토큰 새로고침이 빈번하게 일어나지 않도록 최적화된 미들웨어
export async function middleware(request: NextRequest) {
  // 정적 자원 및 API 요청은 무시
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });
  
  const pathname = request.nextUrl.pathname;
  
  // 현재 페이지가 무엇인지 로그로 기록
  console.log('미들웨어 접근 경로:', pathname);
  
  // 이전에 확인한 경로와 같은 경우 세션 체크를 건너뛰는 로직 (미구현 상태)
  // 실제로는 URL에 임의의 파라미터를 추가하여 캐싱이 발생하지 않도록 조치 필요
  
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  
  try {
    // 중요: CSRF 보호 및 토큰 새로고침
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    const isLoggedIn = !!user;
    
    // 인증 정보 로그
    console.log('인증 상태:', isLoggedIn ? 'Authenticated' : 'Not authenticated');
    
    // 1. 관리자 페이지 접근 제어
    if (pathname.startsWith('/admin')) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.email !== ADMIN_EMAIL) {
        return NextResponse.redirect(new URL('/home', request.url));
      }
      
      return supabaseResponse;
    }
    
    // 2. 홈/온보딩 페이지 접근 제어
    if (pathname.startsWith('/home') || pathname.startsWith('/onboarding')) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // 로그인 상태에서 온보딩/홈 접근 처리
      if (pathname.startsWith('/onboarding')) {
        // 프로필이 이미 있는지는 클라이언트 측에서 확인하도록 함
        return supabaseResponse;
      }
      
      // 프로필이 없는 경우에만 확인 (불필요한 DB 호출 방지)
      if (pathname.startsWith('/home')) {
        try {
          // 프로필 조회 시 최소한의 필드만 가져옴
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
            
          if (profileError || !profile) {
            console.log('프로필 없음, 온보딩으로 리다이렉트');
            return NextResponse.redirect(new URL('/onboarding', request.url));
          }
        } catch (err) {
          console.error('프로필 확인 오류:', err);
        }
      }
      
      return supabaseResponse;
    }
    
    // 3. 로그인 페이지 접근 제어
    if (pathname === '/') {
      if (isLoggedIn) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.email === ADMIN_EMAIL) {
          return NextResponse.redirect(new URL('/admin/community', request.url));
        } else {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('user_id', user.id)
              .single();
              
            if (!profile) {
              return NextResponse.redirect(new URL('/onboarding', request.url));
            } else {
              return NextResponse.redirect(new URL('/home', request.url));
            }
          } catch (err) {
            console.error('프로필 확인 오류:', err);
          }
        }
      }
    }
    
    return supabaseResponse;
  } catch (error) {
    console.error('미들웨어 오류:', error);
    // 오류 발생 시 기본 응답 반환
    return supabaseResponse;
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