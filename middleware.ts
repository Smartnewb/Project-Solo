import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // 세션 가져오기
  const { data: { session }, error } = await supabase.auth.getSession();
  
  // 어드민 경로에 대한 체크
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (error || !session) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉션
      console.log('Admin access failed: No session');
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    // 어드민 권한 체크 - 특정 이메일만 허용
    if (session.user.email !== 'notify@smartnewb.com') {
      console.log('Admin access failed: Not an admin');
      return NextResponse.redirect(new URL('/home', req.url));
    }
    
    console.log('Admin access granted');
    return res;
  }
  
  // 로그인 후 접근 가능한 경로(/home 등)에 대한 체크
  if (req.nextUrl.pathname.startsWith('/home') || 
      req.nextUrl.pathname.startsWith('/onboarding')) {
    if (error || !session) {
      // 로그인되지 않은 경우 로그인 페이지로 리다이렉션
      console.log('Protected route access failed: No session');
      return NextResponse.redirect(new URL('/', req.url));
    }
    
    return res;
  }
  
  // 로그인 페이지에 대한 체크 (이미 로그인된 경우 리다이렉션)
  if (req.nextUrl.pathname === '/') {
    if (session) {
      if (session.user.email === 'notify@smartnewb.com') {
        console.log('Already logged in as admin, redirecting to admin page');
        return NextResponse.redirect(new URL('/admin/community', req.url));
      } else {
        console.log('Already logged in, redirecting to home page');
        return NextResponse.redirect(new URL('/home', req.url));
      }
    }
  }

  return res;
}

export const config = {
  matcher: ['/', '/admin/:path*', '/home/:path*', '/onboarding/:path*'],
}; 