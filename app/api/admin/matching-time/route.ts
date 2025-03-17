import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    console.log('매칭 시간 설정 요청 시작');
    const { matchingDateTime } = await request.json();
    console.log('요청 데이터:', { matchingDateTime });
    
    // 관리자 권한 확인
    const supabase = createRouteHandlerClient({ cookies });
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
    if (session.user.email !== 'notify@smartnewb.com') {
      console.warn('관리자 아님:', session.user.email);
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // system_settings 테이블에 매칭 시간 업데이트
    console.log('system_settings 테이블 업데이트 시작');
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'matching_time',
        matching_datetime: matchingDateTime,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('system_settings 업데이트 오류:', upsertError);
      throw upsertError;
    }

    console.log('매칭 시간 업데이트 성공');
    return NextResponse.json({ success: true, matchingDateTime });
  } catch (error) {
    console.error('매칭 시간 설정 오류:', error);
    return NextResponse.json({ 
      error: '매칭 시간 설정에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    console.log('매칭 시간 조회 요청 시작');
    const supabase = createRouteHandlerClient({ cookies });
    
    // 관리자 권한 확인 (선택적)
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('세션 확인 중 오류 발생:', sessionError);
      // 조회는 권한 검사 없이 계속 진행
    } else {
      console.log('요청 사용자:', session?.user?.email || '인증되지 않음');
    }
    
    // system_settings 테이블에서 매칭 시간 조회
    console.log('system_settings 테이블 조회 시작');
    const { data, error: queryError } = await supabase
      .from('system_settings')
      .select('matching_datetime')
      .eq('id', 'matching_time')
      .single();

    if (queryError) {
      console.error('매칭 시간 조회 쿼리 오류:', queryError);
      
      // PGRST116 오류는 일치하는 행이 없음을 의미
      if (queryError.code === 'PGRST116') {
        console.log('매칭 시간 설정이 없습니다. 기본값 반환');
        return NextResponse.json({ matchingDateTime: null });
      }
      
      throw queryError;
    }

    console.log('매칭 시간 조회 성공:', data?.matching_datetime);
    return NextResponse.json({ matchingDateTime: data?.matching_datetime });
  } catch (error) {
    console.error('매칭 시간 조회 오류:', error);
    return NextResponse.json({ 
      error: '매칭 시간 조회에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
} 