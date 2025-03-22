import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 사용자 알림 조회 API
export async function GET() {
  try {
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
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // 사용자 인증 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('세션 에러:', sessionError.message);
      return NextResponse.json({ error: '인증 오류가 발생했습니다.' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;

    // 사용자의 알림 목록 조회
    const { data: notifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (notificationsError) {
      console.error('알림 정보 조회 에러:', notificationsError.message);
      return NextResponse.json({ error: '알림 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ notifications });

  } catch (error) {
    console.error('알림 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 알림 읽음 처리 API
export async function PATCH(request: NextRequest) {
  try {
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
            } catch (error) {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );

    // 사용자 인증 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('세션 에러:', sessionError.message);
      return NextResponse.json({ error: '인증 오류가 발생했습니다.' }, { status: 401 });
    }

    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const userId = session.user.id;
    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds) || notificationIds.length === 0) {
      return NextResponse.json({ error: '읽음 처리할 알림 ID가 필요합니다.' }, { status: 400 });
    }

    // 해당 알림들이 사용자의 것인지 확인
    const { data: notifications, error: checkError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .in('id', notificationIds);

    if (checkError) {
      console.error('알림 확인 에러:', checkError.message);
      return NextResponse.json({ error: '알림 확인 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 사용자의 알림만 필터링
    const validNotificationIds = notifications.map(n => n.id);
    
    if (validNotificationIds.length === 0) {
      return NextResponse.json({ error: '읽음 처리할 유효한 알림이 없습니다.' }, { status: 400 });
    }

    // 알림 읽음 처리
    const { error: updateError } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', validNotificationIds);

    if (updateError) {
      console.error('알림 업데이트 에러:', updateError.message);
      return NextResponse.json({ error: '알림 읽음 처리 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: '알림이 읽음 처리되었습니다.',
      updatedIds: validNotificationIds
    });

  } catch (error) {
    console.error('알림 읽음 처리 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 