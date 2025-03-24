import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MeetingStatus } from '@/app/types/matching';

// 오프라인 소개팅 예약 목록 조회
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

    // 사용자 관련 모든 오프라인 미팅 예약 조회
    const { data: meetings, error: meetingsError } = await supabase
      .from('offline_meetings')
      .select(`
        *,
        inviter: profiles!offline_meetings_inviter_id_fkey(*),
        invitee: profiles!offline_meetings_invitee_id_fkey(*)
      `)
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
      .order('meeting_date', { ascending: true });

    if (meetingsError) {
      console.error('미팅 정보 조회 에러:', meetingsError.message);
      return NextResponse.json({ error: '미팅 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      meetings: meetings.map(meeting => {
        // 본인 정보와 상대방 정보 구분
        const isInviter = meeting.inviter_id === userId;
        const currentUserProfile = isInviter ? meeting.inviter : meeting.invitee;
        const otherUserProfile = isInviter ? meeting.invitee : meeting.inviter;

        return {
          id: meeting.id,
          status: meeting.status,
          meeting_date: meeting.meeting_date,
          location: meeting.location,
          notes: meeting.notes,
          created_at: meeting.created_at,
          updated_at: meeting.updated_at,
          isInviter,
          otherUser: {
            id: otherUserProfile.id,
            user_id: otherUserProfile.user_id,
            nickname: otherUserProfile.nickname || '익명',
            age: otherUserProfile.age,
            gender: otherUserProfile.gender,
            department: otherUserProfile.department,
            mbti: otherUserProfile.mbti,
            avatar_url: otherUserProfile.avatar_url,
            instagram_id: otherUserProfile.instagram_id
          }
        };
      })
    });

  } catch (error) {
    console.error('오프라인 미팅 조회 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}

// 오프라인 소개팅 예약 생성
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
    const { matchingId, inviteeId, meetingDate, location, notes } = await request.json();

    if (!inviteeId || !meetingDate || !location) {
      return NextResponse.json({ error: '상대방 아이디, 만남 날짜, 장소 정보가 필요합니다.' }, { status: 400 });
    }

    // 매칭 정보 확인 (매칭이 성사된 경우에만 오프라인 소개팅 제안 가능)
    if (matchingId) {
      const { data: matching, error: matchingError } = await supabase
        .from('matchings')
        .select('*')
        .eq('id', matchingId)
        .single();

      if (matchingError) {
        console.error('매칭 정보 조회 에러:', matchingError.message);
        return NextResponse.json({ error: '매칭 정보를 확인하는 중 오류가 발생했습니다.' }, { status: 500 });
      }

      if (!matching || matching.status !== 'MATCHED') {
        return NextResponse.json({ error: '매칭이 성사되지 않았거나 존재하지 않는 매칭입니다.' }, { status: 400 });
      }

      // 요청자가 매칭에 포함된 사용자인지 확인
      if (matching.user1_id !== userId && matching.user2_id !== userId) {
        return NextResponse.json({ error: '해당 매칭에 대한 권한이 없습니다.' }, { status: 403 });
      }

      // 상대방이 매칭에 포함된 사용자인지 확인
      if (matching.user1_id !== inviteeId && matching.user2_id !== inviteeId) {
        return NextResponse.json({ error: '상대방이 해당 매칭에 포함되지 않았습니다.' }, { status: 400 });
      }
    }

    // 오프라인 소개팅 예약 생성
    const { data: meeting, error: meetingError } = await supabase
      .from('offline_meetings')
      .insert({
        inviter_id: userId,
        invitee_id: inviteeId,
        matching_id: matchingId || null,
        meeting_date: meetingDate,
        location,
        notes: notes || '',
        status: MeetingStatus.PENDING
      })
      .select()
      .single();

    if (meetingError) {
      console.error('미팅 생성 에러:', meetingError.message);
      return NextResponse.json({ error: '미팅 예약을 생성하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 알림 생성 (상대방에게)
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: inviteeId,
        content: '새로운 오프라인 소개팅 초대가 도착했습니다.',
        type: 'MEETING_INVITATION',
        related_id: meeting.id
      });

    if (notificationError) {
      console.error('알림 생성 에러:', notificationError.message);
      // 알림 생성 실패는 치명적이지 않으므로 진행
    }

    return NextResponse.json({ 
      success: true, 
      message: '오프라인 소개팅 제안이 성공적으로 전송되었습니다.',
      meeting
    });

  } catch (error) {
    console.error('오프라인 미팅 생성 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 