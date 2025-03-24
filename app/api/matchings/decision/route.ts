import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { MatchStatus } from '@/app/types/matching';

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
    const { matchingId, decision } = await request.json();

    if (!matchingId || decision === undefined) {
      return NextResponse.json({ error: '매칭 아이디와 결정이 필요합니다.' }, { status: 400 });
    }

    // 매칭 정보 조회
    const { data: matching, error: matchingError } = await supabase
      .from('matchings')
      .select('*')
      .eq('id', matchingId)
      .single();

    if (matchingError) {
      console.error('매칭 정보 조회 에러:', matchingError.message);
      return NextResponse.json({ error: '매칭 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    if (!matching) {
      return NextResponse.json({ error: '해당 매칭 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 요청자가 매칭에 포함된 사용자인지 확인
    if (matching.user1_id !== userId && matching.user2_id !== userId) {
      return NextResponse.json({ error: '해당 매칭에 대한 권한이 없습니다.' }, { status: 403 });
    }

    // 어떤 사용자인지 확인하고 해당 결정 필드 업데이트
    const isUser1 = matching.user1_id === userId;
    const updateData: any = {};
    
    if (isUser1) {
      updateData.user1_decision = decision;
    } else {
      updateData.user2_decision = decision;
    }

    // 양쪽 모두 결정했는지 확인하고 매칭 상태 업데이트
    const otherDecision = isUser1 ? matching.user2_decision : matching.user1_decision;
    
    // 상대방이 이미 결정한 경우, 매칭 상태 업데이트
    if (otherDecision !== null) {
      if (decision && otherDecision) {
        // 양쪽 모두 수락한 경우
        updateData.status = MatchStatus.ACCEPTED;
      } else {
        // 한쪽이라도 거절한 경우
        updateData.status = MatchStatus.REJECTED;
      }
    }

    // 매칭 정보 업데이트
    const { error: updateError } = await supabase
      .from('matchings')
      .update(updateData)
      .eq('id', matchingId);

    if (updateError) {
      console.error('매칭 업데이트 에러:', updateError.message);
      return NextResponse.json({ error: '매칭 결정을 저장하는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 알림 생성 
    if (updateData.status) {
      const otherUserId = isUser1 ? matching.user2_id : matching.user1_id;
      
      // 상대방에게 알림 전송
      const notificationContent = updateData.status === MatchStatus.ACCEPTED
        ? '매칭이 성사되었습니다! 상대방과 대화를 시작해보세요.'
        : '매칭이 성사되지 않았습니다.';
        
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: otherUserId,
          content: notificationContent,
          type: 'MATCH_RESULT',
          related_id: matchingId
        });
        
      if (notificationError) {
        console.error('알림 생성 에러:', notificationError.message);
        // 알림 생성 실패는 치명적이지 않으므로 진행
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: '매칭 결정이 저장되었습니다.',
      status: updateData.status
    });

  } catch (error) {
    console.error('매칭 결정 처리 중 오류 발생:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
} 