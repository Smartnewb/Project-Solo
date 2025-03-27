import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { findRematch, RematchResult } from '@/app/matchingAlgorithm';
import { Profile } from '@/app/types/matching';
import { UserPreferences } from '@/types';

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

    // 모든 프로필 가져오기 (매칭 알고리즘용)
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      throw new Error(`프로필 검색 실패: ${profilesError.message}`);
    }

    // 현재 매칭된 사용자의 이전 매칭 파트너 ID 가져오기
    const { data: previousMatchData } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    let previousMatchId: string | undefined = undefined;
    
    if (previousMatchData) {
      previousMatchId = previousMatchData.user1_id === userId 
        ? previousMatchData.user2_id 
        : previousMatchData.user1_id;
    }

    // 사용자 선호도 가져오기
    const { data: userPreferences, error: preferencesError } = await supabase
      .from('user_preferences')
      .select('*');
    
    if (preferencesError) {
      throw new Error(`사용자 선호도 검색 실패: ${preferencesError.message}`);
    }

    // 재매칭 실행
    // 1. 유저와 상대방 프로필 완성
    const userProfileForMatching: Profile = {
      ...userProfile,
      id: userProfile.id,
      gender: userProfile.gender === '남성' ? 'male' : 'female',
      classification: userProfile.classification || 'C',
    };
    
    // 2. 매칭 후보 프로필 변환
    const candidateProfiles: Profile[] = allProfiles
      .filter(profile => profile.id !== userId) // 자기 자신 제외
      .map(profile => ({
        ...profile,
        id: profile.id,
        gender: profile.gender === '남성' ? 'male' : 'female',
        classification: profile.classification || 'C',
      }));
    
    // 3. 사용자 선호도 변환
    const userPref = userPreferences?.find(p => p.user_id === userId);
    const candidatePrefs = userPreferences?.filter(p => p.user_id !== userId) || [];
    
    if (!userPref) {
      // 선호도 정보가 없는 경우 기본값 생성
      const defaultPref: Partial<UserPreferences> = {
        user_id: userId,
        preferred_age_min: 20,
        preferred_age_max: 35,
        preferred_age_type: 'any',
        preferred_height_min: '150',
        preferred_height_max: '190',
        preferred_mbti: ['INFP', 'ENFP', 'INFJ', 'ENFJ'],
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      candidatePrefs.push(defaultPref as UserPreferences);
    }
    
    // 4. 재매칭 알고리즘 실행
    const rematchResult = findRematch(
      userProfileForMatching,
      userPref || {
        user_id: userId,
        preferred_age_min: 20,
        preferred_age_max: 35,
        preferred_age_type: 'any',
        preferred_height_min: '150',
        preferred_height_max: '190',
        preferred_mbti: ['INFP', 'ENFP', 'INFJ', 'ENFJ'],
        id: uuidv4(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      candidateProfiles,
      candidatePrefs,
      previousMatchId
    );
    
    // 매칭 결과가 없으면 실패 처리
    if (!rematchResult) {
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
    
    // 매칭된 파트너 정보
    const matchedPartner = allProfiles.find(p => p.id === rematchResult.newMatch.id);

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
        partnerId: userId === newMatch.user1_id ? newMatch.user2_id : newMatch.user1_id,
        score: rematchResult.score,
        previousMatch: rematchResult.previousMatch ? {
          id: rematchResult.previousMatch.id,
          name: rematchResult.previousMatch.name
        } : null,
        newMatch: {
          id: rematchResult.newMatch.id,
          name: rematchResult.newMatch.name,
          classification: rematchResult.newMatch.classification
        }
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
