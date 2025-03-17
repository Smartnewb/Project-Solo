import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { isSignupEnabled } = await request.json();
    
    // 관리자 권한 확인
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.email !== 'notify@smartnewb.com') {
      return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
    }

    // system_settings 테이블에 signup_enabled 상태 업데이트
    const { error } = await supabase
      .from('system_settings')
      .upsert({ 
        id: 'signup_control',
        signup_enabled: isSignupEnabled,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;

    return NextResponse.json({ success: true, isSignupEnabled });
  } catch (error) {
    console.error('Error updating signup status:', error);
    return NextResponse.json({ error: '회원가입 상태 설정에 실패했습니다.' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // system_settings 테이블에서 signup_enabled 상태 조회
    const { data, error } = await supabase
      .from('system_settings')
      .select('signup_enabled')
      .eq('id', 'signup_control')
      .single();

    if (error) throw error;

    return NextResponse.json({ isSignupEnabled: data?.signup_enabled ?? true });
  } catch (error) {
    console.error('Error fetching signup status:', error);
    return NextResponse.json({ error: '회원가입 상태 조회에 실패했습니다.' }, { status: 500 });
  }
} 