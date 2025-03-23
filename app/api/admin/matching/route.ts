import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST handler for starting the matching process
 * Creates matches between male and female users using a simple algorithm
 */
export async function POST() {
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

    // 남성 사용자 목록 가져오기
    const { data: maleUsers, error: maleError } = await supabase
      .from('profiles')
      .select('*')
      .eq('gender', '남성');
    
    if (maleError) {
      throw new Error(`남성 사용자 목록 조회 실패: ${maleError.message}`);
    }
    
    // 여성 사용자 목록 가져오기
    const { data: femaleUsers, error: femaleError } = await supabase
      .from('profiles')
      .select('*')
      .eq('gender', '여성');
    
    if (femaleError) {
      throw new Error(`여성 사용자 목록 조회 실패: ${femaleError.message}`);
    }
    
    if (!maleUsers || !femaleUsers) {
      return NextResponse.json({ error: '사용자 목록을 불러올 수 없습니다.' }, { status: 500 });
    }
    
    console.log(`매칭 시작: 남성 ${maleUsers.length}명, 여성 ${femaleUsers.length}명`);
    
    // 이미 매칭된 사용자 제외 (기존 매치 확인)
    const { data: existingMatches } = await supabase
      .from('matches')
      .select('user1_id, user2_id');
    
    const matchedUserIds = new Set();
    
    if (existingMatches) {
      existingMatches.forEach(match => {
        matchedUserIds.add(match.user1_id);
        matchedUserIds.add(match.user2_id);
      });
    }
    
    // 매칭되지 않은 사용자만 필터링
    const availableMaleUsers = maleUsers.filter(user => !matchedUserIds.has(user.id));
    const availableFemaleUsers = femaleUsers.filter(user => !matchedUserIds.has(user.id));
    
    console.log(`매칭 가능: 남성 ${availableMaleUsers.length}명, 여성 ${availableFemaleUsers.length}명`);
    
    // 현재 매칭 시간 설정 가져오기
    const { data: settingsData } = await supabase
      .from('system_settings')
      .select('matching_datetime')
      .single();
    
    const matchingDateTime = settingsData?.matching_datetime || new Date().toISOString();
    
    // 매칭 알고리즘 실행
    const matches = [];
    const matchCount = Math.min(availableMaleUsers.length, availableFemaleUsers.length);
    
    // 간단한 매칭: 순서대로 1:1 매칭
    // 실제로는 여기서 취향이나 선호도를 고려한 복잡한 알고리즘을 구현할 수 있음
    for (let i = 0; i < matchCount; i++) {
      const maleUser = availableMaleUsers[i];
      const femaleUser = availableFemaleUsers[i];
      
      matches.push({
        id: uuidv4(),
        user1_id: maleUser.id,
        user2_id: femaleUser.id,
        match_date: new Date().toISOString().split('T')[0],
        match_time: matchingDateTime,
        status: 'pending', // 최초 상태는 대기 중 (사용자에게 공개되기 전)
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 매칭 결과 저장
    if (matches.length > 0) {
      const { error: insertError } = await supabase
        .from('matches')
        .insert(matches);
      
      if (insertError) {
        throw new Error(`매칭 저장 실패: ${insertError.message}`);
      }
    }
    
    return NextResponse.json({
      success: true,
      matchCount: matches.length,
      message: `${matches.length}건의 매칭이 생성되었습니다.`
    });
  } catch (error) {
    console.error('매칭 처리 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '매칭 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
