import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ADMIN_EMAIL } from '@/utils/config';

export async function GET() {
  try {
    console.log('매칭 시간 조회 요청 시작');
    
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // Handle error if needed
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch (error) {
              // Handle error if needed
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

    // 매칭 시간 조회
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('matching_time')
      .eq('id', 'matching_control')
      .single();

    if (settingsError) {
      console.error('매칭 시간 조회 오류:', settingsError);
      return NextResponse.json({ error: '매칭 시간 조회에 실패했습니다.' }, { status: 500 });
    }

    console.log('매칭 시간 조회 성공:', settings?.matching_time);
    // 프론트엔드에서 예상하는 형식으로 응답 만들기
    return NextResponse.json({ 
      matchingTime: settings?.matching_time || null,
      matchingDateTime: settings?.matching_time || null 
    });
  } catch (error) {
    console.error('매칭 시간 조회 중 오류 발생:', error);
    return NextResponse.json({ 
      error: '매칭 시간 조회에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
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
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set(name, value, options);
            } catch (error) {
              // Handle error if needed
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set(name, '', { ...options, maxAge: 0 });
            } catch (error) {
              // Handle error if needed
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

    // 매칭 시간 설정
    const { error: upsertError } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'matching_control',
        matching_time: isoMatchingTime, // ISO 형식의 시간 저장
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('매칭 시간 설정 오류:', upsertError);
      return NextResponse.json({ 
        error: '매칭 시간 설정에 실패했습니다.', 
        details: upsertError.message 
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
    return NextResponse.json({ 
      error: '매칭 시간 설정에 실패했습니다.', 
      details: error instanceof Error ? error.message : '알 수 없는 오류' 
    }, { status: 500 });
  }
} 