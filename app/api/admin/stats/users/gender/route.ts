import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 사용자 권한 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 관리자 계정 검증
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 전체 남성 유저 수 조회
    const { count: maleCount, error: maleError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'male');

    if (maleError) {
      console.error('Error fetching male count:', maleError);
      return NextResponse.json(
        { error: 'Failed to fetch male count' },
        { status: 500 }
      );
    }

    // 전체 여성 유저 수 조회
    const { count: femaleCount, error: femaleError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('gender', 'female');

    if (femaleError) {
      console.error('Error fetching female count:', femaleError);
      return NextResponse.json(
        { error: 'Failed to fetch female count' },
        { status: 500 }
      );
    }

    // 총 유저 수 계산
    const totalUsers = (maleCount || 0) + (femaleCount || 0);
    
    // 성비 비율 계산
    const maleRatio = totalUsers ? parseFloat(((maleCount || 0) / totalUsers * 100).toFixed(2)) : 0;
    const femaleRatio = totalUsers ? parseFloat(((femaleCount || 0) / totalUsers * 100).toFixed(2)) : 0;
    
    // 성비 문자열 생성 (예: "65:35")
    const genderRatio = `${Math.round(maleRatio)}:${Math.round(femaleRatio)}`;

    return NextResponse.json({
      maleCount: maleCount || 0,
      femaleCount: femaleCount || 0,
      totalUsers,
      maleRatio,
      femaleRatio,
      genderRatio
    });
  } catch (error) {
    console.error('Error in gender stats API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
