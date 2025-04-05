import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// 대학별 목표 설정
const UNIVERSITY_TARGETS: Record<string, number> = {
  '한밭대': 20,
  '충남대': 15,
  '충북대': 12,
  '공주대': 10,
  '배재대': 8,
  '목원대': 8,
  '한남대': 10
  // 필요에 따라 타 대학 목표 추가
};

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    
    // 특정 대학 필터 (optional)
    const universityFilter = searchParams.get('university');
    
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

    // 대학별 현재 가입자 수 조회
    let query = supabase
      .from('profiles')
      .select('university, gender')
      
    // 특정 대학 필터 적용
    if (universityFilter) {
      query = query.eq('university', universityFilter);
    }
    
    const { data: universityData, error: universityError } = await query;

    if (universityError) {
      console.error('Error fetching university data:', universityError);
      return NextResponse.json({ error: 'Failed to fetch university data' }, { status: 500 });
    }

    // 대학별 통계 집계
    const universityStats: Record<string, {
      total: number;
      male: number;
      female: number;
      femalePercentage: number;
      targetPercentage: number;
      achievementRate: number;
    }> = {};
    
    // 대학별 데이터 집계
    universityData.forEach(user => {
      if (!user.university) return;
      
      if (!universityStats[user.university]) {
        universityStats[user.university] = {
          total: 0,
          male: 0,
          female: 0,
          femalePercentage: 0,
          targetPercentage: UNIVERSITY_TARGETS[user.university] || 10, // 기본 목표 10%
          achievementRate: 0
        };
      }
      
      universityStats[user.university].total += 1;
      
      if (user.gender === 'male') {
        universityStats[user.university].male += 1;
      } else if (user.gender === 'female') {
        universityStats[user.university].female += 1;
      }
    });
    
    // 통계 계산 및 목표 대비 달성률 산출
    const processedData = Object.entries(universityStats).map(([university, stats]) => {
      const femalePercentage = stats.female / stats.total * 100 || 0;
      const achievementRate = femalePercentage / stats.targetPercentage * 100 || 0;
      
      return {
        university,
        total: stats.total,
        male: stats.male,
        female: stats.female,
        femalePercentage: parseFloat(femalePercentage.toFixed(2)),
        targetPercentage: stats.targetPercentage,
        achievementRate: parseFloat(achievementRate.toFixed(2)),
        isWarning: femalePercentage < stats.targetPercentage * 0.7, // 목표의 70% 미만이면 경고
        isCritical: femalePercentage < stats.targetPercentage * 0.5 // 목표의 50% 미만이면 심각 경고
      };
    }).sort((a, b) => b.achievementRate - a.achievementRate); // 달성률 기준 내림차순 정렬
    
    // 월별 대학 가입자 추이 (최근 6개월)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    sixMonthsAgo.setDate(1); // 월 시작일로 설정
    
    const { data: monthlyData, error: monthlyError } = await supabase
      .from('profiles')
      .select('created_at, university, gender')
      .gte('created_at', sixMonthsAgo.toISOString());
    
    if (monthlyError) {
      console.error('Error fetching monthly data:', monthlyError);
    }
    
    // 월별 데이터 구조화
    const months: Record<string, Record<string, { total: number; female: number }>> = {};
    
    // 최근 6개월 날짜 생성
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - 5 + i);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      months[monthKey] = {};
      
      // 각 대학별 초기값 설정
      Object.keys(universityStats).forEach(university => {
        months[monthKey][university] = { total: 0, female: 0 };
      });
    }
    
    // 월별 데이터 집계
    monthlyData?.forEach(user => {
      if (!user.university) return;
      
      const date = new Date(user.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!months[monthKey]) return; // 6개월 범위 밖이면 무시
      if (!months[monthKey][user.university]) {
        months[monthKey][user.university] = { total: 0, female: 0 };
      }
      
      months[monthKey][user.university].total += 1;
      
      if (user.gender === 'female') {
        months[monthKey][user.university].female += 1;
      }
    });
    
    // 월별 데이터를 배열로 변환
    const monthlyTrends = Object.entries(months).map(([month, universities]) => {
      const universityData: Record<string, { total: number; female: number; femalePercentage: number }> = {};
      
      Object.entries(universities).forEach(([university, stats]) => {
        universityData[university] = {
          ...stats,
          femalePercentage: parseFloat((stats.female / stats.total * 100 || 0).toFixed(2))
        };
      });
      
      return {
        month,
        universities: universityData
      };
    }).sort((a, b) => a.month.localeCompare(b.month)); // 월별 오름차순 정렬
    
    return NextResponse.json({
      universities: processedData,
      monthlyTrends,
      universityTargets: UNIVERSITY_TARGETS
    });
  } catch (error) {
    console.error('Error in university performance API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
