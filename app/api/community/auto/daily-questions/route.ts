import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

// 오늘의 질문 목록 가져오기
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;
  const includeResponses = searchParams.get('includeResponses') === 'true';

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

  // 세션 확인 (선택 사항)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const userId = session?.user?.id;

  try {
    // 오늘의 질문 목록 조회
    const { data: questions, error, count } = await supabase
      .from('daily_questions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('오늘의 질문 조회 오류:', error);
      return NextResponse.json(
        { error: '오늘의 질문 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 응답 포함 여부에 따라 처리
    const formattedQuestions = await Promise.all(
      questions.map(async (question: any) => {
        // 사용자의 응답 여부 확인
        let userResponse = null;
        if (userId) {
          const { data: responseData, error: responseError } = await supabase
            .from('daily_question_responses')
            .select('id, content, created_at')
            .eq('question_id', question.id)
            .eq('user_id', userId)
            .single();

          if (!responseError) {
            userResponse = responseData;
          }
        }

        // 다른 사용자 응답 포함 여부
        let responses: Array<any> = [];
        let responseCount = 0;

        if (includeResponses) {
          // 질문에 대한 모든 응답 조회 (최신순으로 10개만)
          const { data: allResponses, error: responsesError, count: responsesCount } = await supabase
            .from('daily_question_responses')
            .select('*, profiles!inner(username, avatar_url)', { count: 'exact' })
            .eq('question_id', question.id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!responsesError && allResponses) {
            responses = allResponses;
            responseCount = responsesCount || 0;
          }
        } else {
          // 응답 개수만 조회
          const { count: responsesCount, error: countError } = await supabase
            .from('daily_question_responses')
            .select('id', { count: 'exact' })
            .eq('question_id', question.id);

          if (!countError) {
            responseCount = responsesCount || 0;
          }
        }

        // 결과 반환
        return {
          ...question,
          user_response: userResponse,
          responses: includeResponses ? responses : [],
          response_count: responseCount
        };
      })
    );

    return NextResponse.json({
      questions: formattedQuestions,
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err) {
    console.error('오늘의 질문 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 오늘의 질문에 응답하기
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { questionId, content } = body;

  if (!questionId || !content) {
    return NextResponse.json(
      { error: '질문 ID와 응답 내용이 필요합니다.' },
      { status: 400 }
    );
  }

  if (content.length > 500) {
    return NextResponse.json(
      { error: '응답은 500자를 초과할 수 없습니다.' },
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
    // 질문이 존재하는지 확인
    const { data: question, error: questionError } = await supabase
      .from('daily_questions')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError) {
      return NextResponse.json(
        { error: '해당 질문을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 응답했는지 확인
    const { data: existingResponse, error: responseCheckError } = await supabase
      .from('daily_question_responses')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .single();

    if (!responseCheckError && existingResponse) {
      // 이미 응답한 경우, 업데이트
      const { data: updatedResponse, error: updateError } = await supabase
        .from('daily_question_responses')
        .update({ content })
        .eq('id', existingResponse.id)
        .select('*, profiles(username, avatar_url)')
        .single();

      if (updateError) {
        throw updateError;
      }

      return NextResponse.json({
        message: '응답이 업데이트되었습니다.',
        response: updatedResponse
      });
    }

    // 새 응답 작성
    const { data: newResponse, error: createError } = await supabase
      .from('daily_question_responses')
      .insert({
        question_id: questionId,
        user_id: userId,
        content
      })
      .select('*, profiles(username, avatar_url)')
      .single();

    if (createError) {
      throw createError;
    }

    // 응답 수 업데이트
    await supabase.rpc('increment_question_response_count', {
      question_id_param: questionId
    });

    return NextResponse.json({
      message: '응답이 등록되었습니다.',
      response: newResponse
    });
  } catch (err) {
    console.error('오늘의 질문 응답 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 