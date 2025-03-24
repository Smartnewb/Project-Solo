import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MeetingStatus } from '@/types/matching';

export async function POST(request: NextRequest) {
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
    const { meetingId, accept } = await request.json();

    if (!meetingId || accept === undefined) {
      return NextResponse.json({ error: '미팅 아이디와 응답이 필요합니다.' }, { status: 400 });
    }

    // 미팅 정보 조회
    const { data: meeting, error: meetingError } = await supabase
      .from('offline_meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError) {
      console.error('미팅 정보 조회 에러:', meetingError.message);
      return NextResponse.json({ error: '미팅 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!meeting) {
      return NextResponse.json({ error: '해당 미팅 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청자가 초대받은 사용자인지 확인
    if (meeting.invitee_id !== userId) {
      return NextResponse.json({ error: '해당 미팅 초대에 대한 응답 권한이 없습니다.' }, { status: 403 });
    }

    // 이미 응답한 미팅인지 확인
    if (meeting.status !== MeetingStatus.PENDING) {
      return NextResponse.json({ error: '이미 응답한 미팅 초대입니다.' }, { status: 400 });
    }

    // 미팅 상태 업데이트
    const newStatus = accept ? MeetingStatus.ACCEPTED : MeetingStatus.REJECTED;
    const { error: updateError } = await supabase
      .from('offline_meetings')
      .update({ status: newStatus })
      .eq('id', meetingId);

    if (updateError) {
      console.error('미팅 업데이트 에러:', updateError.message);
      return NextResponse.json({ error: '미팅 응답을 저장하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 알림 생성 (초대자에게)
    const notificationContent = accept
      ? '오프라인 소개팅 초대가 수락되었습니다.'
      : '오프라인 소개팅 초대가 거절되었습니다.';
      
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: meeting.inviter_id,
        content: notificationContent,
        type: 'MEETING_RESPONSE',
        related_id: meetingId
      });
      
    if (notificationError) {
      console.error('알림 생성 에러:', notificationError.message);
      // 알림 생성 실패는 치명적이지 않으므로 진행
    }

    return NextResponse.json({ 
      success: true, 
      message: accept ? '미팅 초대를 수락했습니다.' : '미팅 초대를 거절했습니다.',
      status: newStatus
    });

  } catch (error) {
    console.error('미팅 응답 처리 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 