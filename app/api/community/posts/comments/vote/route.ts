import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * POST /api/community/posts/comments/vote
 * 댓글에 좋아요를 추가합니다.
 * 요청 바디:
 * - comment_id: 댓글 ID (필수)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { comment_id } = body;

  if (!comment_id) {
    return NextResponse.json(
      { error: '댓글 ID가 필요합니다.' },
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
    // 댓글 존재 여부 확인
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('id')
      .eq('id', comment_id)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '해당 댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 이미 투표했는지 확인
    const { data: existingVote, error: voteError } = await supabase
      .from('comment_votes')
      .select('id')
      .eq('comment_id', comment_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: '이미 해당 댓글에 좋아요를 눌렀습니다.' },
        { status: 400 }
      );
    }

    // 투표 추가
    const { data: vote, error } = await supabase
      .from('comment_votes')
      .insert({
        comment_id,
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

    // 댓글의 좋아요 수 업데이트
    await supabase
      .from('comments')
      .update({ likes_count: supabase.rpc('increment', { inc: 1 }) })
      .eq('id', comment_id);

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
 * DELETE /api/community/posts/comments/vote
 * 댓글에 좋아요를 제거합니다.
 * query params:
 * - comment_id: 댓글 ID (필수)
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const commentId = searchParams.get('comment_id');

  if (!commentId) {
    return NextResponse.json(
      { error: '댓글 ID가 필요합니다.' },
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
      .from('comment_votes')
      .select('id')
      .eq('comment_id', commentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!vote) {
      return NextResponse.json(
        { error: '해당 댓글에 좋아요를 누르지 않았습니다.' },
        { status: 404 }
      );
    }

    // 투표 삭제
    const { error } = await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userId);

    if (error) {
      console.error('좋아요 삭제 오류:', error);
      return NextResponse.json(
        { error: '좋아요를 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 댓글의 좋아요 수 업데이트
    await supabase
      .from('comments')
      .update({ likes_count: supabase.rpc('decrement', { dec: 1 }) })
      .eq('id', commentId);

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