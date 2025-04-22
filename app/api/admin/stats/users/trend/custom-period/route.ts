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

    // 지정된 기간 내 가입자 데이터 조회
    const { data: signups, error: signupsError } = await supabase
      .from('profiles')
      .select('created_at, gender')
      .gte('created_at', new Date(startDate).toISOString())
      .lte('created_at', new Date(endDate).toISOString())
      .order('created_at', { ascending: true });

    if (signupsError) {
      console.error('Error fetching signup trend data:', signupsError);
      return NextResponse.json(
        { error: 'Failed to fetch signup trend data' },
        { status: 500 }
      );
    }

    // 일별 가입자 집계
    const dailySignups: Record<string, { date: string; count: number; male: number; female: number }> = {};
    
    signups.forEach(signup => {
      const dateStr = new Date(signup.created_at).toISOString().split('T')[0];
      
      if (!dailySignups[dateStr]) {
        dailySignups[dateStr] = { date: dateStr, count: 0, male: 0, female: 0 };
      }
      
      dailySignups[dateStr].count += 1;
      
      if (signup.gender === 'male') {
        dailySignups[dateStr].male += 1;
      } else if (signup.gender === 'female') {
        dailySignups[dateStr].female += 1;
      }
    });
    
    // 일별 가입자 데이터를 배열로 변환
    const dailySignupsData = Object.values(dailySignups);
    
    // 날짜 범위 내 데이터가 없는 날짜에 대해 0으로 채우기
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateRange: string[] = [];
    
    // 날짜 범위 생성
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateRange.push(dateStr);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // 빈 날짜 채우기
    const completeData = dateRange.map(dateStr => {
      if (dailySignups[dateStr]) {
        return dailySignups[dateStr];
      }
      return { date: dateStr, count: 0, male: 0, female: 0 };
    });
    
    return NextResponse.json({
      data: completeData,
      startDate,
      endDate
    });
  } catch (error) {
    console.error('Error in custom period signup trend API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
