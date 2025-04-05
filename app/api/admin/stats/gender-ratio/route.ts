import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    
    // 기간 필터
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const endDate = searchParams.get('endDate') || new Date().toISOString();
    
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

    // 대학별 성비 데이터 조회
    const { data: genderRatioByUniversity, error: genderError } = await supabase
      .from('profiles')
      .select('university, gender')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (genderError) {
      console.error('Error fetching gender ratio:', genderError);
      return NextResponse.json({ error: 'Failed to fetch gender ratio data' }, { status: 500 });
    }

    // 대학별 성비 계산
    const universityStats: Record<string, { male: number; female: number; total: number; femalePercentage: number }> = {};
    
    genderRatioByUniversity.forEach(user => {
      if (!user.university) return;
      
      if (!universityStats[user.university]) {
        universityStats[user.university] = { male: 0, female: 0, total: 0, femalePercentage: 0 };
      }
      
      if (user.gender === 'male') {
        universityStats[user.university].male += 1;
      } else if (user.gender === 'female') {
        universityStats[user.university].female += 1;
      }
      
      universityStats[user.university].total += 1;
    });
    
    // 여성 비율 계산 및 경고 플래그 추가
    const processedData = Object.entries(universityStats).map(([university, stats]) => {
      const femalePercentage = stats.female / stats.total * 100 || 0;
      return {
        university,
        male: stats.male,
        female: stats.female,
        total: stats.total,
        femalePercentage: parseFloat(femalePercentage.toFixed(2)),
        isWarning: femalePercentage < 25, // 25% 미만 경고
        isCritical: femalePercentage < 20 // 20% 미만 심각 경고
      };
    }).sort((a, b) => b.total - a.total); // 총 사용자 수 기준 내림차순 정렬
    
    // 전체 통계 계산
    const totalStats = processedData.reduce(
      (acc, curr) => {
        acc.male += curr.male;
        acc.female += curr.female;
        acc.total += curr.total;
        return acc;
      },
      { male: 0, female: 0, total: 0 }
    );
    
    const totalFemalePercentage = totalStats.female / totalStats.total * 100 || 0;
    
    return NextResponse.json({
      universities: processedData,
      total: {
        ...totalStats,
        femalePercentage: parseFloat(totalFemalePercentage.toFixed(2)),
        isWarning: totalFemalePercentage < 25,
        isCritical: totalFemalePercentage < 20
      }
    });
  } catch (error) {
    console.error('Error in gender ratio API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
