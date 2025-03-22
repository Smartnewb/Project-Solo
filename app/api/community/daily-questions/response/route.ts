import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/community/daily-questions/response
 * 오늘의 질문에 응답을 추가합니다.
 * 요청 바디:
 * - question_id: 질문 ID (필수)
 * - content: 응답 내용 (필수)
 * - is_anonymous: 익명 여부 (선택, 기본값: false)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { question_id, content, is_anonymous = false } = body;

  // 필수 필드 확인
  if (!question_id) {
    return NextResponse.json(
      { error: '질문 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!content || content.trim() === '') {
    return NextResponse.json(
      { error: '응답 내용이 필요합니다.' },
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
    // 질문 존재 여부 확인
    const { data: question, error: questionError } = await supabase
      .from('daily_questions')
      .select('id')
      .eq('id', question_id)
      .single();

    if (questionError || !question) {
      return NextResponse.json(
        { error: '해당 질문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 응답했는지 확인
    const { data: existingResponse, error: responseError } = await supabase
      .from('daily_question_responses')
      .select('id')
      .eq('question_id', question_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingResponse) {
      return NextResponse.json(
        { error: '이미 이 질문에 응답했습니다.' },
        { status: 400 }
      );
    }

    // 응답 생성
    const { data: response, error } = await supabase
      .from('daily_question_responses')
      .insert({
        question_id,
        user_id: userId,
        content,
        is_anonymous,
        likes_count: 0
      })
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('응답 생성 오류:', error);
      return NextResponse.json(
        { error: '응답을 생성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 질문의 응답 수 업데이트
    await supabase
      .from('daily_questions')
      .update({ response_count: supabase.rpc('increment', { inc: 1 }) })
      .eq('id', question_id);

    // 익명 응답인 경우 작성자 정보 숨기기
    let formattedResponse = response;
    if (is_anonymous) {
      formattedResponse = {
        ...response,
        user_id: null,
        profiles: {
          username: '익명',
          avatar_url: null
        }
      };
    }

    // 자신이 작성한 응답임을 표시
    formattedResponse.is_mine = true;

    return NextResponse.json({
      message: '응답이 성공적으로 추가되었습니다.',
      data: formattedResponse
    });
  } catch (err) {
    console.error('응답 생성 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/daily-questions/response
 * 오늘의 질문 응답을 삭제합니다.
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
    // 응답 조회
    const { data: response, error: responseError } = await supabase
      .from('daily_question_responses')
      .select('id, user_id, question_id')
      .eq('id', responseId)
      .single();

    if (responseError || !response) {
      return NextResponse.json(
        { error: '해당 응답을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자 확인
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = userProfile?.is_admin === true;

    // 권한 확인 (작성자 또는 관리자만 삭제 가능)
    if (response.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '응답을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 응답에 관련된 좋아요 삭제
    await supabase
      .from('daily_question_response_votes')
      .delete()
      .eq('response_id', responseId);

    // 응답 삭제
    const { error } = await supabase
      .from('daily_question_responses')
      .delete()
      .eq('id', responseId);

    if (error) {
      console.error('응답 삭제 오류:', error);
      return NextResponse.json(
        { error: '응답을 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 질문의 응답 수 업데이트
    if (response.question_id) {
      await supabase
        .from('daily_questions')
        .update({ response_count: supabase.rpc('decrement', { dec: 1 }) })
        .eq('id', response.question_id);
    }

    return NextResponse.json({
      message: '응답이 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    console.error('응답 삭제 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 