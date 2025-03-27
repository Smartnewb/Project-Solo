import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. 프로필 삭제
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) throw profileError;

    // 2. 선호도 데이터 삭제
    const { error: prefError } = await supabaseAdmin
      .from('user_preferences')
      .delete()
      .eq('user_id', userId);

    if (prefError) throw prefError;

    // 3. Auth 사용자 삭제
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) throw authError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('회원 탈퇴 처리 중 오류:', error);
    return NextResponse.json(
      { error: '회원 탈퇴 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 