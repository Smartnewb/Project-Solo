import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function GET() {
  // 쿠키에서 Supabase 클라이언트 생성
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
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
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  try {
    // 읽지 않은 알림 개수 조회
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('알림 개수 조회 오류:', error);
      return NextResponse.json(
        { error: '알림 개수를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 결과 반환
    return NextResponse.json({ count: count || 0 });
  } catch (err) {
    console.error('알림 개수 조회 중 예외 발생:', err);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 