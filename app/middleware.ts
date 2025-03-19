import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_EMAIL } from '@/utils/config'

export async function middleware(req: NextRequest) {
  // 정적 리소스 및 API 요청은 즉시 패스스루
  if (
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api') ||
    req.nextUrl.pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value)
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 공개 경로는 세션 체크 없이 통과
  if (['/login', '/signup', '/'].includes(req.nextUrl.pathname)) {
    return response
  }

  // 인증이 필요한 경로에 대한 체크
  if (!session) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  // 관리자 전용 경로 체크
  if (req.nextUrl.pathname.startsWith('/admin')) {
    if (session.user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/home', req.url))
    }
  }

  return response
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