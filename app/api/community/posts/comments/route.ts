import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * GET /api/community/posts/comments
 * 댓글 목록을 가져옵니다.
 * query params:
 * - post_id: 게시물 ID (필수)
 * - page: 페이지 번호 (기본값: 1)
 * - per_page: 페이지당 댓글 수 (기본값: 10)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const postId = searchParams.get('post_id');
  const page = parseInt(searchParams.get('page') || '1');
  const perPage = parseInt(searchParams.get('per_page') || '10');

  // post_id는 필수 파라미터
  if (!postId) {
    return NextResponse.json(
      { error: '게시물 ID가 필요합니다.' },
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
    // 댓글 총 개수 가져오기
    const { count: totalCount, error: countError } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId);

    if (countError) {
      console.error('댓글 수 조회 오류:', countError);
      return NextResponse.json(
        { error: '댓글 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 페이지네이션 계산
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    // 댓글 목록 조회 (작성자 정보 포함)
    const { data: comments, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles:user_id (
          id,
          username,
          avatar_url
        )
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('댓글 목록 조회 오류:', error);
      return NextResponse.json(
        { error: '댓글 목록을 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 익명 댓글은 작성자 정보 숨기기
    const formattedComments = comments.map(comment => {
      if (comment.is_anonymous) {
        return {
          ...comment,
          user_id: null,
          profiles: {
            username: '익명',
            avatar_url: null
          }
        };
      }
      return comment;
    });

    // 세션 확인
    const {
      data: { session },
    } = await supabase.auth.getSession();
    
    const currentUserId = session?.user?.id;

    // 현재 사용자가 작성한 댓글이면 표시
    const commentsWithOwnership = formattedComments.map(comment => ({
      ...comment,
      is_mine: comment.user_id === currentUserId
    }));

    return NextResponse.json({
      data: commentsWithOwnership,
      pagination: {
        page,
        per_page: perPage,
        total_count: totalCount || 0,
        total_pages: Math.ceil((totalCount || 0) / perPage)
      }
    });
  } catch (err) {
    console.error('댓글 목록 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/community/posts/comments
 * 새 댓글을 작성합니다.
 * 요청 바디:
 * - post_id: 게시물 ID (필수)
 * - content: 댓글 내용 (필수)
 * - is_anonymous: 익명 여부 (선택, 기본값: false)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { post_id, content, is_anonymous = false } = body;

  // 필수 필드 확인
  if (!post_id) {
    return NextResponse.json(
      { error: '게시물 ID가 필요합니다.' },
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
    // 게시물 존재 여부 확인
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('id, comments')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: '해당 게시물을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('nickname, profile_image')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('사용자 정보 조회 오류:', userError);
      return NextResponse.json(
        { error: '사용자 정보를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 현재 시간
    const now = new Date().toISOString();

    // 댓글 생성
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        post_id,
        user_id: userId,
        content,
        is_anonymous,
        created_at: now,
        updated_at: now,
        likes_count: 0
      })
      .select()
      .single();

    if (error) {
      console.error('댓글 생성 오류:', error);
      return NextResponse.json(
        { error: '댓글을 작성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 게시물의 comments 배열에 새 댓글 추가
    const commentData = {
      id: comment.id,
      user_id: is_anonymous ? null : userId,
      content: comment.content,
      nickname: is_anonymous ? '익명' : userData.nickname || '익명',
      profile_image: is_anonymous ? null : userData.profile_image,
      created_at: now,
      is_anonymous
    };

    const updatedComments = [...(post.comments || []), commentData];

    // 게시물 업데이트
    const { error: updateError } = await supabase
      .from('posts')
      .update({ comments: updatedComments })
      .eq('id', post_id);

    if (updateError) {
      console.error('게시물 업데이트 오류:', updateError);
      // 댓글은 이미 생성되었으므로 경고만 로그로 남김
    }

    // 댓글 응답에 작성자 정보 포함
    const formattedComment = {
      ...comment,
      author: {
        id: is_anonymous ? null : userId,
        nickname: is_anonymous ? '익명' : userData.nickname || '익명',
        image_url: is_anonymous ? null : userData.profile_image
      },
      is_mine: true
    };

    return NextResponse.json({
      message: '댓글이 성공적으로 작성되었습니다.',
      data: formattedComment
    });
  } catch (err) {
    console.error('댓글 생성 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 