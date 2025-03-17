import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { matchingDateTime } = await request.json();
    
    // 관리자 권한 확인
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.email !== 'notify@smartnewb.com') {
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
    }

    // system_settings 테이블에 매칭 시간 업데이트
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'matching_time',
        matching_datetime: matchingDateTime,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, matchingDateTime });
  } catch (error) {
    console.error('Error updating matching time:', error);
    return NextResponse.json({ error: '매칭 시간 설정에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // system_settings 테이블에서 매칭 시간 조회
    const { data, error } = await supabase
      .from('system_settings')
      .select('matching_datetime')
      .eq('id', 'matching_time')
      .single();

    if (error) throw error;

    return NextResponse.json({ matchingDateTime: data?.matching_datetime });
  } catch (error) {
    console.error('Error fetching matching time:', error);
    return NextResponse.json({ error: '매칭 시간 조회에 실패했습니다.' }, { status: 500 });
  }
} 