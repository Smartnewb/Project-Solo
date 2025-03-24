import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log('회원가입 상태 설정 요청 시작');
    const { isSignupEnabled } = await request.json();
    console.log('요청 데이터:', { isSignupEnabled });
    
    const cookieStore = cookies();
    console.log('쿠키 가져오기 성공');
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('세션 조회 오류:', sessionError);
      return NextResponse.json({ error: '인증 세션 오류가 발생했습니다.' }, { status: 401 });
    }
    
    if (!session || !session.user) {
      console.warn('세션 없음 - 인증되지 않은 요청');
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    console.log('사용자 이메일:', session.user.email);
    const isAdmin = process.env.NODE_ENV === 'development' || session.user.email === 'notify@smartnewb.com';
    
    if (!isAdmin) {
      console.warn('관리자 아님:', session.user.email);
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'signup_control',
        signup_enabled: isSignupEnabled,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('system_settings 업데이트 오류:', upsertError);
      return NextResponse.json({ 
        error: '데이터베이스 업데이트 오류', 
        details: upsertError.message 
      }, { status: 500 });
    }

    console.log('회원가입 상태 업데이트 성공:', isSignupEnabled);
    return NextResponse.json({ success: true, isSignupEnabled });
  } catch (error) {
    console.error('회원가입 상태 설정 오류:', error);
    return NextResponse.json({ 
      error: '회원가입 상태 설정에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('회원가입 상태 조회 요청 시작');
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    const { data, error } = await supabase
      .from('system_settings')
      .select('signup_enabled')
      .eq('id', 'signup_control')
      .single();

    if (error) {
      console.error('회원가입 상태 조회 오류:', error);
      return NextResponse.json({ isSignupEnabled: true }); // 기본값으로 true 반환
    }

    return NextResponse.json({ isSignupEnabled: data?.signup_enabled ?? true });
  } catch (error) {
    console.error('회원가입 상태 조회 중 오류 발생:', error);
    return NextResponse.json({ isSignupEnabled: true }); // 오류 시 기본값으로 true 반환
  }
} 