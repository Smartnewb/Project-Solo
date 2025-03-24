import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/utils/config';

/**
 * GET handler for retrieving all matches for admin
 * Returns a list of all matched users with their profile information
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 관리자 이메일로 권한 확인
    if (user.email !== ADMIN_EMAIL) {
      console.warn('관리자 아님:', user.email);
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 모든 매칭 정보 조회 (프로필 정보 포함)
    const { data: matches, error: matchesError } = await supabase
      .from('matches')
      .select(`
        *,
        user1: profiles!matches_user1_id_fkey(*),
        user2: profiles!matches_user2_id_fkey(*)
      `)
      .order('created_at', { ascending: false });
    
    if (matchesError) {
      console.error('매칭 정보 조회 에러:', matchesError.message);
      return NextResponse.json({ error: '매칭 정보를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
    }

    // 반환할 매칭 정보 포맷팅
    const formattedMatches = matches.map((match, index) => {
      const user1Profile = match.user1;
      const user2Profile = match.user2;

      return {
        id: match.id,
        index: index + 1,
        status: match.status,
        created_at: match.created_at,
        match_date: match.match_date,
        user1: {
          id: user1Profile.id,
          user_id: user1Profile.user_id,
          name: user1Profile.name || user1Profile.nickname || '익명',
          classification: user1Profile.classification || 'N/A',
          gender: user1Profile.gender,
          age: user1Profile.age,
          department: user1Profile.department,
          instagram_id: user1Profile.instagram_id || 'N/A',
          mbti: user1Profile.mbti,
          interests: user1Profile.interests || []
        },
        user2: {
          id: user2Profile.id,
          user_id: user2Profile.user_id,
          name: user2Profile.name || user2Profile.nickname || '익명',
          classification: user2Profile.classification || 'N/A',
          gender: user2Profile.gender,
          age: user2Profile.age,
          department: user2Profile.department,
          instagram_id: user2Profile.instagram_id || 'N/A',
          mbti: user2Profile.mbti,
          interests: user2Profile.interests || []
        }
      };
    });

    return NextResponse.json({
      success: true,
      matches: formattedMatches,
      total: formattedMatches.length
    });

  } catch (error) {
    console.error('매칭 목록 조회 중 오류 발생:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '매칭 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
