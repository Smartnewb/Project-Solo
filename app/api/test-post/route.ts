import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  try {
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

    if (!session) {
      return NextResponse.json(
        { error: '사용자 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // 사용자 정보 가져오기
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('nickname, profile_image')
      .eq('id', session.user.id)
      .single();

    if (userError) {
      return NextResponse.json(
        { error: '사용자 정보를 가져올 수 없습니다: ' + userError.message },
        { status: 500 }
      );
    }

    // 현재 시간
    const now = new Date().toISOString();

    // 테스트 게시글 생성
    const postData = {
      title: '테스트 게시글 (API) - ' + now.substring(0, 19),
      content: '테스트 API에서 생성된 게시글입니다. 작성 시간: ' + now,
      category: 'questions',
      user_id: session.user.id,
      nickname: userData.nickname || '익명',
      profile_image: userData.profile_image || null,
      created_at: now,
      updated_at: now,
      isEdited: false,
      isdeleted: false,
      isBlinded: false,
      likes: [],
      comments: [],
      reports: []
    };

    // 게시글 저장
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert([postData])
      .select();

    if (postError) {
      return NextResponse.json(
        { error: '게시글 생성 중 오류가 발생했습니다: ' + postError.message },
        { status: 500 }
      );
    }

    // 테스트 댓글 생성
    if (post && post.length > 0) {
      const postId = post[0].id;
      
      // 댓글 데이터
      const commentData = {
        post_id: postId,
        user_id: session.user.id,
        content: 'API에서 자동 생성된 테스트 댓글입니다.',
        is_anonymous: false,
        created_at: now,
        updated_at: now,
        likes_count: 0
      };
      
      // 댓글 생성
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert([commentData])
        .select();

      if (commentError) {
        return NextResponse.json({
          message: '게시글은 생성되었지만 댓글 생성 중 오류가 발생했습니다',
          post,
          error: commentError.message
        });
      }
      
      // 게시글에 댓글 추가
      const newComment = {
        id: comment[0].id,
        user_id: session.user.id,
        content: comment[0].content,
        nickname: userData.nickname || '익명',
        profile_image: userData.profile_image || null,
        created_at: now,
        is_anonymous: false
      };
      
      // 게시글 업데이트
      const { error: updateError } = await supabase
        .from('posts')
        .update({ 
          comments: [newComment]
        })
        .eq('id', postId);
      
      if (updateError) {
        return NextResponse.json({
          message: '게시글과 댓글은 생성되었지만 게시글 업데이트 중 오류가 발생했습니다',
          post,
          comment,
          error: updateError.message
        });
      }
      
      return NextResponse.json({
        message: '테스트 게시글과 댓글이 성공적으로 생성되었습니다',
        post,
        comment
      });
    }

    return NextResponse.json({
      message: '테스트 게시글이 성공적으로 생성되었습니다',
      post
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '테스트 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
} 