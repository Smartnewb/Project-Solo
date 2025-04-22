import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    
    // 요청 본문에서 시작일과 종료일 추출
    const { startDate, endDate } = await request.json();
    
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: '시작일과 종료일이 필요합니다.' },
        { status: 400 }
      );
    }
    
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

    // 지정된 기간 내 가입자 수 조회
    const { count: totalSignups, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(startDate).toISOString())
      .lte('created_at', new Date(endDate).toISOString());

    if (countError) {
      console.error('Error fetching signup count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch signup count' },
        { status: 500 }
      );
    }

    // 성별 통계 조회
    const { data: genderData, error: genderError } = await supabase
      .from('profiles')
      .select('gender')
      .gte('created_at', new Date(startDate).toISOString())
      .lte('created_at', new Date(endDate).toISOString());

    if (genderError) {
      console.error('Error fetching gender data:', genderError);
      return NextResponse.json(
        { error: 'Failed to fetch gender data' },
        { status: 500 }
      );
    }

    // 성별 통계 계산
    const genderStats = genderData.reduce(
      (acc, curr) => {
        if (curr.gender === 'male') acc.male += 1;
        else if (curr.gender === 'female') acc.female += 1;
        return acc;
      },
      { male: 0, female: 0 }
    );

    // 여성 비율 계산
    const femalePercentage = totalSignups 
      ? parseFloat(((genderStats.female / totalSignups) * 100).toFixed(2))
      : 0;

    return NextResponse.json({
      totalSignups: totalSignups || 0,
      maleSignups: genderStats.male,
      femaleSignups: genderStats.female,
      femalePercentage,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Error in custom period signup count API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
