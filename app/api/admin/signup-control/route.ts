import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log('회원가입 상태 설정 요청 시작');
    const { isSignupEnabled } = await request.json();
    console.log('요청 데이터:', { isSignupEnabled });
    
    // 관리자 권한 확인
    const cookieStore = cookies();
    console.log('쿠키 가져오기 성공');
    
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    console.log('Supabase 클라이언트 생성 성공');
    
    // 테이블 존재 여부 확인
    try {
      // 간단한 쿼리로 테이블 존재 여부 확인
      const { error: tableCheckError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.error('테이블 확인 오류:', tableCheckError);
        // 테이블이 없거나 권한이 없는 경우 테이블 생성 시도
        await createSystemSettingsTable(supabase);
      } else {
        console.log('system_settings 테이블 존재 확인됨');
      }
    } catch (tableCheckErr) {
      console.error('테이블 확인 중 오류:', tableCheckErr);
      await createSystemSettingsTable(supabase);
    }
    
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
    // 이메일 주소로 관리자 확인 (개발 환경에서는 모든 사용자 허용)
    const isAdmin = process.env.NODE_ENV === 'development' || session.user.email === 'notify@smartnewb.com';
    
    if (!isAdmin) {
      console.warn('관리자 아님:', session.user.email);
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // system_settings 테이블에 signup_enabled 상태 업데이트
    console.log('system_settings 테이블 업데이트 시작');
    
    try {
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
    } catch (dbError) {
      console.error('데이터베이스 오류:', dbError);
      
      // 테이블이 없는 경우를 위한 오류 처리
      return NextResponse.json({ 
        error: '데이터베이스 오류가 발생했습니다.', 
        details: dbError instanceof Error ? dbError.message : '알 수 없는 오류' 
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

// 테이블 생성 함수
async function createSystemSettingsTable(supabase: SupabaseClient) {
  console.log('system_settings 테이블 생성 시도');
  
  try {
    // SQL 쿼리를 사용하여 테이블 생성
    const { error } = await supabase.rpc('create_system_settings_table');
    
    if (error) {
      console.error('테이블 생성 RPC 오류:', error);
      // RPC가 없는 경우 기본값 반환
      return;
    }
    
    console.log('system_settings 테이블 생성 성공');
  } catch (createError) {
    console.error('테이블 생성 중 오류:', createError);
  }
}

export async function GET() {
  try {
    console.log('회원가입 상태 조회 요청 시작');
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      // 간단한 쿼리로 테이블 존재 여부 확인
      const { error: tableCheckError } = await supabase
        .from('system_settings')
        .select('id')
        .limit(1);
        
      if (tableCheckError) {
        console.error('테이블 확인 오류:', tableCheckError);
        // 테이블이 없거나 권한이 없는 경우 기본값 반환
        return NextResponse.json({ isSignupEnabled: true });
      }
    } catch (tableCheckErr) {
      console.error('테이블 확인 중 오류:', tableCheckErr);
      return NextResponse.json({ isSignupEnabled: true });
    }
    
    // 관리자 권한 확인 (선택적)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('세션 확인 중 오류 발생:', sessionError);
      // 조회는 권한 검사 없이 계속 진행
    } else {
      console.log('요청 사용자:', session?.user?.email || '인증되지 않음');
    }
    
    // system_settings 테이블에서 signup_enabled 상태 조회
    console.log('system_settings 테이블 조회 시작');
    
    try {
      const { data, error: queryError } = await supabase
        .from('system_settings')
        .select('signup_enabled')
        .eq('id', 'signup_control')
        .single();

      if (queryError) {
        console.error('회원가입 상태 조회 쿼리 오류:', queryError);
        
        // PGRST116 오류는 일치하는 행이 없음을 의미
        if (queryError.code === 'PGRST116') {
          console.log('회원가입 상태 설정이 없습니다. 기본값 반환');
          return NextResponse.json({ isSignupEnabled: true });
        }
        
        return NextResponse.json({ 
          isSignupEnabled: true,
          error: queryError.message
        });
      }

      console.log('회원가입 상태 조회 성공:', data?.signup_enabled ?? true);
      return NextResponse.json({ isSignupEnabled: data?.signup_enabled ?? true });
    } catch (dbError) {
      console.error('데이터베이스 조회 오류:', dbError);
      
      // 테이블이 없는 경우를 위한 오류 처리
      return NextResponse.json({ isSignupEnabled: true });
    }
  } catch (error) {
    console.error('회원가입 상태 조회 오류:', error);
    return NextResponse.json({ 
      error: '회원가입 상태 조회에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류',
      isSignupEnabled: true
    }, { status: 500 });
  }
} 