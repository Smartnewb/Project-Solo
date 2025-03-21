import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { PostCategory } from '@/types/community';

// 게시글 목록 조회
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

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
    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles:user_id (
          id,
          nickname,
          image_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // 카테고리 필터링이 있는 경우
    if (category) {
      query = query.eq('category', category);
    }

    const { data: posts, error, count } = await query.returns<any[]>();

    if (error) {
      console.error('게시글 조회 오류:', error);
      return NextResponse.json(
        { error: '게시글 목록을 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 익명 게시글 처리: 작성자 정보 숨김
    const formattedPosts = posts.map(post => {
      const formattedPost = {
        ...post,
        author: post.is_anonymous 
          ? { nickname: '익명' } 
          : post.profiles
      };
      
      // profiles 필드 제거 (중복 데이터)
      delete formattedPost.profiles;
      
      return formattedPost;
    });

    return NextResponse.json({
      posts: formattedPosts,
      totalCount: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (err) {
    console.error('게시글 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 게시글 생성
export async function POST(request: NextRequest) {
  // 요청 본문 파싱
  const body = await request.json();
  const { title, content, category, is_anonymous } = body;

  // 데이터 검증
  if (!title || !content || !category) {
    return NextResponse.json(
      { error: '제목, 내용, 카테고리는 필수 항목입니다.' },
      { status: 400 }
    );
  }

  // 카테고리 검증
  if (!Object.values(PostCategory).includes(category as PostCategory)) {
    return NextResponse.json(
      { error: '유효하지 않은 카테고리입니다.' },
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
    // 게시글 추가
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: userId,
        title,
        content,
        category,
        is_anonymous: is_anonymous || false,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('게시글 추가 오류:', error);
      return NextResponse.json(
        { error: '게시글을 작성하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error('게시글 작성 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 