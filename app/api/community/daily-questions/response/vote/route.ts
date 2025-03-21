import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/community/daily-questions/response/vote
 * 오늘의 질문 응답에 좋아요를 추가합니다.
 * 요청 바디:
 * - response_id: 응답 ID (필수)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { response_id } = body;

  if (!response_id) {
    return NextResponse.json(
      { error: '응답 ID가 필요합니다.' },
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 무시
          }
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
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 응답 존재 여부 확인
    const { data: response, error: responseError } = await supabase
      .from('daily_question_responses')
      .select('id, user_id')
      .eq('id', response_id)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: '해당 응답을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 자신의 응답에는 좋아요를 누를 수 없음
    if (response.user_id === userId) {
      return NextResponse.json(
        { error: '자신의 응답에는 좋아요를 누를 수 없습니다.' },
        { status: 400 }
      );
    }

    // 이미 투표했는지 확인
    const { data: existingVote, error: voteError } = await supabase
      .from('daily_question_response_votes')
      .select('id')
      .eq('response_id', response_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: '이미 해당 응답에 좋아요를 눌렀습니다.' },
        { status: 400 }
      );
    }

    // 투표 추가
    const { data: vote, error } = await supabase
      .from('daily_question_response_votes')
      .insert({
        response_id,
        user_id: userId
      })
      .select()
      .single();

    if (error) {
      console.error('좋아요 추가 오류:', error);
      return NextResponse.json(
        { error: '좋아요를 추가하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 응답의 좋아요 수 업데이트
    await supabase
      .from('daily_question_responses')
      .update({ likes_count: supabase.rpc('increment', { inc: 1 }) })
      .eq('id', response_id);

    return NextResponse.json({
      message: '좋아요가 성공적으로 추가되었습니다.',
      data: vote
    });
  } catch (err) {
    console.error('좋아요 추가 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/daily-questions/response/vote
 * 오늘의 질문 응답에 좋아요를 제거합니다.
 * query params:
 * - response_id: 응답 ID (필수)
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const responseId = searchParams.get('response_id');

  if (!responseId) {
    return NextResponse.json(
      { error: '응답 ID가 필요합니다.' },
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
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 서버 컴포넌트에서 호출된 경우 무시
          }
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
      { error: '로그인이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 투표 존재 여부 확인
    const { data: vote, error: voteError } = await supabase
      .from('daily_question_response_votes')
      .select('id')
      .eq('response_id', responseId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!vote) {
      return NextResponse.json(
        { error: '해당 응답에 좋아요를 누르지 않았습니다.' },
        { status: 404 }
      );
    }

    // 투표 삭제
    const { error } = await supabase
      .from('daily_question_response_votes')
      .delete()
      .eq('response_id', responseId)
      .eq('user_id', userId);

    if (error) {
      console.error('좋아요 삭제 오류:', error);
      return NextResponse.json(
        { error: '좋아요를 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 응답의 좋아요 수 업데이트
    await supabase
      .from('daily_question_responses')
      .update({ likes_count: supabase.rpc('decrement', { dec: 1 }) })
      .eq('id', responseId);

    return NextResponse.json({
      message: '좋아요가 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    console.error('좋아요 삭제 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 