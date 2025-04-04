import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { ADMIN_EMAIL } from '@/utils/config';

// 정적 생성에서 동적 렌더링으로 전환
export const dynamic = 'force-dynamic';

/**
 * GET handler to retrieve all rematch requests
 * Returns a list of users who have requested a rematch
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
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });
    }

    // 재매칭 요청 목록 가져오기
    const { data: matchingRequests, error: requestsError } = await supabase
      .from('matching_requests')
      .select(`
        *,
        profiles:user_id (
          name,
          gender
        )
      `)
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      throw new Error(`재매칭 요청 목록 조회 실패: ${requestsError.message}`);
    }

    // 각 요청에 대해 이전 매칭 파트너 정보 조회
    const formattedRequests = await Promise.all(matchingRequests.map(async (request) => {
      // 사용자의 성별에 따라 매칭 테이블에서 조회할 컬럼 결정
      const isMale = request.profiles?.gender === 'male';
      
      // 이전 매칭 정보 조회
      const { data: matchData } = await supabase
        .from('matches')
        .select(`
          *,
          partner:${isMale ? 'user2_id' : 'user1_id'}(
            name,
            instagram_id
          )
        `)
        .eq(isMale ? 'user1_id' : 'user2_id', request.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return {
        id: request.id,
        user_id: request.user_id,
        userName: request.profiles?.name || '이름 없음',
        gender: request.profiles?.gender || '성별 미상',
        status: request.status,
        created_at: request.created_at,
        updated_at: request.updated_at,
        matchedPartner: matchData?.partner ? {
          name: matchData.partner.name,
          instagramId: matchData.partner.instagram_id
        } : null
      };
    }));
    
    return NextResponse.json({
      success: true,
      requests: formattedRequests
    });
  } catch (error) {
    console.error('재매칭 요청 목록 조회 중 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '재매칭 요청 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
