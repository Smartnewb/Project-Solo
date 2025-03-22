import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 직접 Supabase 클라이언트 생성 (쿠키/인증 우회)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    // 서비스 롤 키로 Supabase 클라이언트 생성 (권한 우회)
    const adminSuapbase = createClient(supabaseUrl, supabaseServiceKey);
    
    // 첫 번째 사용자 가져오기
    const { data: users, error: userError } = await adminSuapbase
      .from('profiles')
      .select('id, nickname, profile_image')
      .limit(1);
      
    if (userError || !users || users.length === 0) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다: ' + (userError?.message || 'No users found') },
        { status: 500 }
      );
    }
    
    const user = users[0];
    
    // 현재 시간
    const now = new Date().toISOString();
    
    // 테스트 게시글 생성
    const postData = {
      title: '테스트 게시글 (직접 API) - ' + now.substring(0, 19),
      content: '테스트 직접 API에서 생성된 게시글입니다. 작성 시간: ' + now,
      category: 'questions',
      user_id: user.id,
      nickname: user.nickname || '익명',
      profile_image: user.profile_image || null,
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
    const { data: post, error: postError } = await adminSuapbase
      .from('posts')
      .insert([postData])
      .select()
      .single();
      
    if (postError) {
      return NextResponse.json(
        { error: '게시글 생성 중 오류가 발생했습니다: ' + postError.message },
        { status: 500 }
      );
    }
    
    // 테스트 댓글 생성
    const commentData = {
      post_id: post.id,
      user_id: user.id,
      content: '직접 API에서 자동 생성된 테스트 댓글입니다.',
      is_anonymous: false,
      created_at: now,
      updated_at: now,
      likes_count: 0
    };
    
    const { data: comment, error: commentError } = await adminSuapbase
      .from('comments')
      .insert([commentData])
      .select()
      .single();
      
    if (commentError) {
      return NextResponse.json({
        message: '게시글은 생성되었지만 댓글 생성 중 오류가 발생했습니다',
        post,
        error: commentError.message
      });
    }
    
    // 게시글에 댓글 추가
    const newComment = {
      id: comment.id,
      user_id: user.id,
      content: comment.content,
      nickname: user.nickname || '익명',
      profile_image: user.profile_image || null,
      created_at: now,
      is_anonymous: false
    };
    
    const { error: updateError } = await adminSuapbase
      .from('posts')
      .update({
        comments: [newComment]
      })
      .eq('id', post.id);
    
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
      post_id: post.id,
      comment_id: comment.id,
      user_id: user.id,
      created_at: now
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '테스트 중 오류가 발생했습니다: ' + error.message },
      { status: 500 }
    );
  }
} 