import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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
    
    // 관리자 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('user_id', user.id)
      .single();
    
    if (!adminCheck || !adminCheck.is_admin) {
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
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (requestsError) {
      throw new Error(`재매칭 요청 목록 조회 실패: ${requestsError.message}`);
    }
    
    // 클라이언트에 반환하기 위한 형태로 데이터 변환
    const formattedRequests = matchingRequests.map(request => ({
      id: request.id,
      user_id: request.user_id,
      userName: request.profiles?.name || '이름 없음',
      gender: request.profiles?.gender || '성별 미상',
      status: request.status,
      created_at: request.created_at,
      updated_at: request.updated_at
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
