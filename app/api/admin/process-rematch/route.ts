import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// 정적 생성에서 동적 렌더링으로 전환
export const dynamic = 'force-dynamic';

/**
 * POST handler for processing a rematch request
 * Takes a single user who requested a rematch and finds a new match for them
 */
export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 관리자 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!adminCheck || !adminCheck.is_admin) {
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 요청 데이터 파싱
    const requestData = await request.json();
    const { userId } = requestData;
    
    if (!userId) {
      return NextResponse.json({ error: '사용자 ID가 제공되지 않았습니다.' }, { status: 400 });
    }

    // 재매칭을 요청한 사용자 정보 가져오기
    const { data: userProfile, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (userError || !userProfile) {
      return NextResponse.json({ error: '사용자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 기존 매치 정보 제거 (상태를 'cancelled'로 변경)
    const { error: updateError } = await supabase
      .from('matches')
      .update({ status: 'cancelled' })
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('status', 'pending');

    if (updateError) {
      throw new Error(`기존 매치 취소 실패: ${updateError.message}`);
    }

    // 재매칭을 위한 파트너 찾기 (성별에 맞는 다른 사용자 중에서 매치가 없는 사람)
    const oppositeGender = userProfile.gender === '남성' ? '여성' : '남성';
    
    // 이미 매칭된 사용자 목록 가져오기
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('status', 'pending');
    
    const matchedUserIds = new Set();
    
    if (existingMatches) {
      existingMatches.forEach(match => {
        matchedUserIds.add(match.user1_id);
        matchedUserIds.add(match.user2_id);
      });
    }

    // 재매칭 대상 검색
    const { data: potentialMatches, error: matchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('gender', oppositeGender);
    
    if (matchError) {
      throw new Error(`잠재적 매치 검색 실패: ${matchError.message}`);
    }

    // 매칭되지 않은 사용자 필터링
    const availableMatches = potentialMatches.filter(profile => 
      !matchedUserIds.has(profile.id) && profile.id !== userId
    );

    if (availableMatches.length === 0) {
      // 재매칭 요청 상태 업데이트 (매칭 불가)
      await supabase
        .from('matching_requests')
        .update({ status: 'no_match' })
        .eq('user_id', userId);
      
      return NextResponse.json({
        success: false,
        message: '현재 재매칭 가능한 사용자가 없습니다.'
      });
    }

    // 간단한 매칭 알고리즘 (첫 번째 가용 사용자와 매칭)
    // 실제로는 취향이나 선호도를 고려한 알고리즘 사용 가능
    const matchedPartner = availableMatches[0];

    // 현재 매칭 시간 설정 가져오기
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('matching_datetime')
      .single();
    
    const matchingDateTime = settingsData?.matching_datetime || new Date().toISOString();

    // 새로운 매치 생성
    const newMatch = {
      id: uuidv4(),
      user1_id: userProfile.gender === '남성' ? userProfile.id : matchedPartner.id,
      user2_id: userProfile.gender === '남성' ? matchedPartner.id : userProfile.id,
      match_date: new Date().toISOString().split('T')[0],
      match_time: matchingDateTime,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from('matches')
      .insert([newMatch]);
    
    if (insertError) {
      throw new Error(`새 매치 생성 실패: ${insertError.message}`);
    }

    // 재매칭 요청 상태 업데이트 (완료)
    await supabase
      .from('matching_requests')
      .update({ status: 'completed' })
      .eq('user_id', userId);

    return NextResponse.json({
      success: true,
      message: '재매칭이 성공적으로 처리되었습니다.',
      match: {
        id: newMatch.id,
        userId: userId,
        partnerId: userId === newMatch.user1_id ? newMatch.user2_id : newMatch.user1_id
      }
    });
  } catch (error) {
    console.error('재매칭 처리 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '재매칭 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
