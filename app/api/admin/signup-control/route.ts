import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ADMIN_EMAIL } from '@/utils/config';

export async function POST(request: Request) {
  try {
    console.log('회원가입 상태 설정 요청 시작');
    const { isSignupEnabled } = await request.json();
    
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
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    // ADMIN_EMAIL로 관리자 권한 확인
    if (session.user.email !== ADMIN_EMAIL) {
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