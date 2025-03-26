// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_EMAIL } from '@/utils/config';

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

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
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // 비로그인 유저가 접근 가능한 경로
  const publicPaths = ['/', '/signup', '/api/admin/signup-control'];
  const isPublicPath = publicPaths.some((path) => pathname === path || pathname.startsWith('/api/'));

  // 관리자 전용 경로
  const isAdminPath = pathname.startsWith('/admin');

  if (!user) {
    // 비로그인 유저는 public paths만 접근 가능
    if (!isPublicPath) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }
  } else {
    // 로그인 유저의 관리자 페이지 접근 제한
    if (isAdminPath && user.email !== ADMIN_EMAIL) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = '/home';
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
