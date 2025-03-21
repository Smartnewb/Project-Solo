import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 선호 조건 가져오기
export async function GET() {
  // 쿠키에서 Supabase 클라이언트 생성
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 인증되지 않은 사용자에게는 오류 응답
  if (!session) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 유저 선호 조건 가져오기
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {  // PGRST116: 결과 없음 (정상)
      console.error('선호 조건 조회 오류:', error);
      return NextResponse.json(
        { error: '선호 조건을 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 기본값 설정
    const preferences = data || {
      ageRange: { min: 20, max: 35 },
      gender: '',
      personalities: [],
      interests: [],
      location: '',
    };

    // 결과 반환
    return NextResponse.json({ preferences });
  } catch (err) {
    console.error('선호 조건 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 선호 조건 업데이트
export async function PUT(request: NextRequest) {
  // 요청 본문 파싱
  const body = await request.json();
  const { preferences } = body;

  // 선호 조건 검증
  if (!preferences) {
    return NextResponse.json(
      { error: '유효하지 않은 요청 형식입니다.' },
      { status: 400 }
    );
  }

  // 쿠키에서 Supabase 클라이언트 생성
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // 세션 확인
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 인증되지 않은 사용자에게는 오류 응답
  if (!session) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 기존 선호 조건 확인
    const { data: existingData, error: fetchError } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('기존 선호 조건 확인 오류:', fetchError);
      return NextResponse.json(
        { error: '선호 조건을 확인하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    let result;

    // 기존 선호 조건이 있으면 업데이트, 없으면 생성
    if (existingData) {
      // 기존 데이터 업데이트
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          age_range: preferences.ageRange,
          gender: preferences.gender,
          personalities: preferences.personalities,
          interests: preferences.interests,
          location: preferences.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingData.id);

      if (updateError) {
        throw updateError;
      }

      result = { message: '선호 조건이 업데이트되었습니다.' };
    } else {
      // 새 데이터 생성
      const { error: insertError } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          age_range: preferences.ageRange,
          gender: preferences.gender,
          personalities: preferences.personalities,
          interests: preferences.interests,
          location: preferences.location,
        });

      if (insertError) {
        throw insertError;
      }

      result = { message: '선호 조건이 생성되었습니다.' };
    }

    // 성공 응답
    return NextResponse.json(result);
  } catch (err) {
    console.error('선호 조건 업데이트 중 오류 발생:', err);
    return NextResponse.json(
      { error: '선호 조건을 저장하는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 