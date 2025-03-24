import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const ADMIN_EMAIL = 'notify@smartnewb.com';

// 토큰 새로고침이 빈번하게 일어나지 않도록 최적화된 미들웨어
export async function middleware(request: NextRequest) {
  // 인증이 필요하지 않은 경로 확인
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/images') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/join') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/signup') ||
    request.nextUrl.pathname === '/'
  ) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  
  // 현재 페이지가 무엇인지 로그로 기록
  console.log('미들웨어 접근 경로:', pathname);
  
  try {
    // 응답 객체 생성
    let supabaseResponse = NextResponse.next({
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
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
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
    
    // 중요: CSRF 보호 및 토큰 새로고침
    const {
      data: { user },
    } = await supabase.auth.getUser();
    
    // 로그인 필요한 페이지 접근 시 리다이렉트
    if (
      !user &&
      !request.nextUrl.pathname.startsWith('/login') &&
      !request.nextUrl.pathname.startsWith('/join') &&
      !request.nextUrl.pathname.startsWith('/auth') &&
      !request.nextUrl.pathname.startsWith('/signup') &&
      request.nextUrl.pathname !== '/'
    ) {
      console.log('인증되지 않은 사용자가 접근 시도:', request.nextUrl.pathname);
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
    
    const isLoggedIn = !!user;
    
    // 인증 정보 로그
    console.log('인증 상태:', isLoggedIn ? 'Authenticated' : 'Not authenticated');
    
    // 인증이 필요한 경로에 대한 접근 제어
    if ((pathname.startsWith('/home') || pathname.startsWith('/profile') || pathname.startsWith('/onboarding')) && !isLoggedIn) {
      console.log('인증 필요 경로 접근 거부:', pathname);
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // 어드민 페이지 접근 제어
    if (pathname.startsWith('/admin') && !isLoggedIn) {
      console.log('비로그인 상태에서 어드민 페이지 접근 시도');
      return NextResponse.redirect(new URL('/', request.url));
    }
    
    // 로그인 상태인 경우
    if (isLoggedIn) {
      // 관리자 여부 확인
      if (user.email === ADMIN_EMAIL) {
        console.log('관리자 사용자 확인됨:', user.email);
        
        // 관리자가 루트 페이지, 온보딩 또는 일반 사용자 페이지 접근 시 관리자 대시보드로 리디렉션
        if (pathname === '/' || pathname.startsWith('/onboarding') || pathname.startsWith('/home')) {
          console.log('관리자가 일반 페이지 접근, 관리자 대시보드로 리디렉션');
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        
        // 관리자 페이지 접근은 허용
        if (pathname.startsWith('/admin')) {
          return supabaseResponse;
        }
      } else {
        // 일반 사용자는 관리자 페이지 접근 불가
        if (pathname.startsWith('/admin')) {
          console.log('일반 사용자의 관리자 페이지 접근 시도');
          return NextResponse.redirect(new URL('/home', request.url));
        }
        
        // 일반 사용자의 루트 페이지 접근
        if (pathname === '/') {
          console.log('로그인 사용자의 루트 페이지 접근, 프로필 확인 필요');
          
          // 프로필이 있는지 확인
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();
          
          if (profileError && profileError.code === 'PGRST116') {
            console.log('프로필이 없습니다. 온보딩으로 리디렉션합니다.');
            return NextResponse.redirect(new URL('/onboarding', request.url));
          } else if (profileError) {
            console.error('프로필 확인 오류:', profileError);
          }
          
          console.log('프로필이 있습니다. 홈으로 리디렉션합니다.');
          return NextResponse.redirect(new URL('/home', request.url));
        }
        
        // 로그인된 일반 사용자가 프로필 없이 홈 또는 프로필 페이지 접근 시 온보딩으로 리디렉션
        if ((pathname.startsWith('/home') || pathname.startsWith('/profile')) && !pathname.startsWith('/onboarding')) {
          try {
            // 프로필이 있는지 확인 - count 방식으로 변경하여 더 안정적으로 확인
            const { count, error: countError } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);
            
            // 명시적으로 count가 0인 경우에만 프로필이 없다고 판단
            if (countError) {
              console.error('프로필 카운트 확인 오류:', countError);
              // 오류가 있더라도 페이지 접근은 허용 (UX 개선)
            } else if (count === 0) {
              console.log('프로필이 없는 사용자의 홈/프로필 접근, 온보딩으로 리디렉션합니다.');
              return NextResponse.redirect(new URL('/onboarding', request.url));
            } else {
              console.log('프로필이 확인됨, 계속 진행합니다. 프로필 수:', count);
            }
          } catch (profileCheckError) {
            console.error('프로필 확인 중 예외 발생:', profileCheckError);
            // 예외가 발생해도 페이지 접근은 허용 (UX 개선)
          }
        }

        
      }
    }
    
    return supabaseResponse;
  } catch (error) {
    console.error('미들웨어 오류:', error);
    // 오류 발생 시 기본 응답 반환
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 