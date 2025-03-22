import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

interface RouteParams {
  params: {
    id: string;
  };
}

// 게시글 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: '게시글 ID가 필요합니다.' },
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
    // 게시글 조회
    const { data: post, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          nickname,
          image_url
        ),
        comments:comments (
          id,
          content,
          is_anonymous,
          likes_count,
          created_at,
          user_id,
          profiles:user_id (
            id,
            nickname,
            image_url
          )
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('게시글 조회 오류:', error);
      return NextResponse.json(
        { error: '게시글을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!post) {
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 익명 게시글 처리: 작성자 정보 숨김
    const formattedPost = {
      ...post,
      author: post.is_anonymous ? { nickname: '익명' } : post.profiles,
      comments: post.comments.map((comment: any) => ({
        ...comment,
        author: comment.is_anonymous ? { nickname: '익명' } : comment.profiles,
        // profiles 필드 제거 (중복 데이터)
        profiles: undefined
      }))
    };

    // profiles 필드 제거 (중복 데이터)
    delete formattedPost.profiles;

    return NextResponse.json({ post: formattedPost });
  } catch (err) {
    console.error('게시글 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 수정
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = params;
  const body = await request.json();
  const { title, content } = body;

  if (!id) {
    return NextResponse.json(
      { error: '게시글 ID가 필요합니다.' },
      { status: 400 }
    );
  }

  if (!title && !content) {
    return NextResponse.json(
      { error: '수정할 내용이 필요합니다.' },
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
    // 게시글 소유자 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('게시글 조회 오류:', fetchError);
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.is_admin || false;

    // 소유자 또는 관리자만 수정 가능
    if (post.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '게시글을 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 게시글 업데이트
    const updateData: any = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    updateData.updated_at = new Date().toISOString();

    const { data, error: updateError } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('게시글 수정 오류:', updateError);
      return NextResponse.json(
        { error: '게시글을 수정하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data });
  } catch (err) {
    console.error('게시글 수정 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 삭제
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = params;

  if (!id) {
    return NextResponse.json(
      { error: '게시글 ID가 필요합니다.' },
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
    // 게시글 소유자 확인
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('게시글 조회 오류:', fetchError);
      return NextResponse.json(
        { error: '게시글을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 관리자 확인
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();

    const isAdmin = profile?.is_admin || false;

    // 소유자 또는 관리자만 삭제 가능
    if (post.user_id !== userId && !isAdmin) {
      return NextResponse.json(
        { error: '게시글을 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 댓글 먼저 삭제
    await supabase.from('comments').delete().eq('post_id', id);

    // 게시글 좋아요 삭제
    await supabase.from('post_votes').delete().eq('post_id', id);

    // 게시글 삭제
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('게시글 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '게시글을 삭제하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('게시글 삭제 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 