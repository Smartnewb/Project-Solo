import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ADMIN_EMAIL } from '@/utils/config';

export async function GET() {
  try {
    console.log('매칭 시간 조회 요청 시작');
    
    const cookieStore = cookies();
    console.log('쿠키 스토어 생성 성공');
    
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
    
    console.log('Supabase 클라이언트 생성 성공');
    
    // 일반 사용자도 매칭 시간을 확인할 수 있도록 인증 검사 제거
    // 관리자 포털 POST 요청(설정 변경)에는 인증이 여전히 필요함

    // 매칭 시간 조회 쿼리 확인
    console.log('데이터베이스 쿼리 실행 전: matching_control 테이블에서 matching_time 컬럼 조회');
    
    // 매칭 시간 조회
    const { data: settings, error: settingsError } = await supabase
      .from('matching_control')
      .select('matching_time')
      .eq('id', 'matching_time')
      .single();

    if (settingsError) {
      console.error('매칭 시간 조회 오류:', settingsError);
      console.error('오류 상세 정보:', JSON.stringify(settingsError));
      
      // system_settings 테이블이 있는지 확인
      console.log('system_settings 테이블 존재 여부 확인');
      const { data: tables, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public')
        .eq('tablename', 'system_settings');
      
      if (tablesError) {
        console.error('테이블 목록 조회 오류:', tablesError);
      } else {
        console.log('테이블 존재 여부 확인 결과:', tables);
      }
      
      return NextResponse.json({ 
        error: '매칭 시간 조회에 실패했습니다.', 
        details: settingsError.message,
        code: settingsError.code
      }, { status: 500 });
    }

    console.log('매칭 시간 조회 성공:', settings?.matching_time);
    // 프론트엔드에서 예상하는 형식으로 응답 만들기
    return NextResponse.json({ 
      matchingTime: settings?.matching_time || null,
      matchingDateTime: settings?.matching_time || null 
    });
  } catch (error) {
    console.error('매칭 시간 조회 중 오류 발생:', error);
    let errorMessage = '알 수 없는 오류';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { 
        name: error.name, 
        stack: error.stack 
      };
    }
    
    return NextResponse.json({ 
      error: '매칭 시간 조회에 실패했습니다.', 
      message: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('매칭 시간 설정 요청 시작');
    const { matchingTime } = await request.json();
    console.log('요청 데이터:', { matchingTime });
    
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

    // 세션 확인
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
    if (session.user.email !== ADMIN_EMAIL) {
      console.warn('관리자 아님:', session.user.email);
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 매칭 시간 유효성 검사
    const matchingDate = new Date(matchingTime);
    if (isNaN(matchingDate.getTime())) {
      return NextResponse.json({ error: '유효하지 않은 날짜 형식입니다.' }, { status: 400 });
    }

    // 매칭 시간이 현재 시간보다 이후인지 확인
    if (matchingDate < new Date()) {
      return NextResponse.json({ error: '매칭 시간은 현재 시간 이후로 설정해야 합니다.' }, { status: 400 });
    }
    
    // 타임존 일관성을 위해 ISO 문자열로 변환
    const isoMatchingTime = matchingDate.toISOString();

    console.log('matching_control 테이블 업데이트 시도');
    
    // 매칭 시간 설정
    const { error: upsertError } = await supabase
      .from('matching_control')
      .upsert({ 
        id: 'matching_time',
        matching_time: isoMatchingTime, // ISO 형식의 시간 저장
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('매칭 시간 설정 오류:', upsertError);
      console.error('오류 상세 정보:', JSON.stringify(upsertError));
      return NextResponse.json({ 
        error: '매칭 시간 설정에 실패했습니다.', 
        details: upsertError.message,
        code: upsertError.code
      }, { status: 500 });
    }

    console.log('매칭 시간 설정 성공:', isoMatchingTime);
    return NextResponse.json({ 
      success: true, 
      matchingTime: isoMatchingTime,
      matchingDateTime: isoMatchingTime 
    });
  } catch (error) {
    console.error('매칭 시간 설정 중 오류 발생:', error);
    let errorMessage = '알 수 없는 오류';
    let errorDetails = {};
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = { 
        name: error.name, 
        stack: error.stack 
      };
    }
    
    return NextResponse.json({ 
      error: '매칭 시간 설정에 실패했습니다.', 
      message: errorMessage,
      details: errorDetails
    }, { status: 500 });
  }
} 