import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/community/posts/comments/[id]
 * 특정 댓글 정보를 가져옵니다.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const commentId = params.id;

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

  try {
    // 댓글 조회 (작성자 정보 포함)
    const { data: comment, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('id', commentId)
      .single();

    if (error) {
      console.error('댓글 조회 오류:', error);
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 익명 댓글인 경우 작성자 정보 숨기기
    let formattedComment = comment;
    if (comment.is_anonymous) {
      formattedComment = {
        ...comment,
        user_id: null,
        profiles: {
          username: '익명',
          avatar_url: null
        }
      };
    }

    // 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    const currentUserId = session?.user?.id;

    // 자신이 작성한 댓글인지 확인
    formattedComment.is_mine = comment.user_id === currentUserId;

    return NextResponse.json({ data: formattedComment });
  } catch (err) {
    console.error('댓글 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/community/posts/comments/[id]
 * 특정 댓글을 수정합니다.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const commentId = params.id;
  const body = await request.json();
  const { content } = body;

  if (!commentId) {
    return NextResponse.json(
      { error: '댓글 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!content || content.trim() === '') {
    return NextResponse.json(
      { error: '댓글 내용이 필요합니다.' },
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
    // 댓글 조회
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
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

    // 권한 확인 (작성자 또는 관리자만 수정 가능)
    if (comment.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '댓글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 수정
    const { data: updatedComment, error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
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
      console.error('댓글 수정 오류:', error);
      return NextResponse.json(
        { error: '댓글을 수정하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 익명 댓글인 경우 작성자 정보 숨기기
    let formattedComment = updatedComment;
    if (updatedComment.is_anonymous) {
      formattedComment = {
        ...updatedComment,
        user_id: null,
        profiles: {
          username: '익명',
          avatar_url: null
        }
      };
    }

    // 자신이 작성한 댓글임을 표시
    formattedComment.is_mine = true;

    return NextResponse.json({
      message: '댓글이 성공적으로 수정되었습니다.',
      data: formattedComment
    });
  } catch (err) {
    console.error('댓글 수정 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/community/posts/comments/[id]
 * 특정 댓글을 삭제합니다.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const commentId = params.id;

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
    // 댓글 조회
    const { data: comment, error: commentError } = await supabase
      .from('comments')
      .select('*, posts:post_id (id)')
      .eq('id', commentId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
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
    if (comment.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '댓글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글에 관련된 투표 삭제
    await supabase
      .from('comment_votes')
      .delete()
      .eq('comment_id', commentId);

    // 댓글 삭제
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('댓글 삭제 오류:', error);
      return NextResponse.json(
        { error: '댓글을 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 게시물의 댓글 수 업데이트
    if (comment.post_id && comment.posts) {
      await supabase
        .from('posts')
        .update({ comments_count: supabase.rpc('decrement', { dec: 1 }) })
        .eq('id', comment.post_id);
    }

    return NextResponse.json({
      message: '댓글이 성공적으로 삭제되었습니다.'
    });
  } catch (err) {
    console.error('댓글 삭제 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}