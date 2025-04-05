import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { searchParams } = new URL(request.url);
    
    // 기간 필터 (기본: 지난 30일)
    const period = searchParams.get('period') || 'month';
    const endDate = new Date();
    let startDate = new Date();
    
    // 기간에 따른 시작일 설정
    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
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

    // 전체 가입자 통계
    const { data: signups, error: signupsError } = await supabase
      .from('profiles')
      .select('created_at, gender, university, referral_code')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: true });

    if (signupsError) {
      console.error('Error fetching signup data:', signupsError);
      return NextResponse.json({ error: 'Failed to fetch signup data' }, { status: 500 });
    }

    // 일별 가입자 집계
    const dailySignups: Record<string, { date: string; total: number; male: number; female: number }> = {};
    
    signups.forEach(signup => {
      const dateStr = new Date(signup.created_at).toISOString().split('T')[0];
      
      if (!dailySignups[dateStr]) {
        dailySignups[dateStr] = { date: dateStr, total: 0, male: 0, female: 0 };
      }
      
      dailySignups[dateStr].total += 1;
      
      if (signup.gender === 'male') {
        dailySignups[dateStr].male += 1;
      } else if (signup.gender === 'female') {
        dailySignups[dateStr].female += 1;
      }
    });
    
    // 대학별 가입자 집계
    const universitySignups: Record<string, { total: number; male: number; female: number }> = {};
    
    signups.forEach(signup => {
      if (!signup.university) return;
      
      if (!universitySignups[signup.university]) {
        universitySignups[signup.university] = { total: 0, male: 0, female: 0 };
      }
      
      universitySignups[signup.university].total += 1;
      
      if (signup.gender === 'male') {
        universitySignups[signup.university].male += 1;
      } else if (signup.gender === 'female') {
        universitySignups[signup.university].female += 1;
      }
    });
    
    // 친구 초대 코드 사용 현황
    const referralCounts: Record<string, number> = {};
    
    signups.forEach(signup => {
      if (!signup.referral_code) return;
      
      if (!referralCounts[signup.referral_code]) {
        referralCounts[signup.referral_code] = 0;
      }
      
      referralCounts[signup.referral_code] += 1;
    });
    
    // 여성 사용자 친구 초대 코드 통계 계산을 위한 추가 쿼리
    const { data: femaleReferrals, error: femaleReferralsError } = await supabase
      .from('profiles')
      .select('id, referral_code')
      .eq('gender', 'female');
      
    if (femaleReferralsError) {
      console.error('Error fetching female referral data:', femaleReferralsError);
    }
    
    const femaleReferralCodes = new Set(
      femaleReferrals?.filter(p => p.referral_code).map(p => p.referral_code) || []
    );
    
    // 일별 가입자 데이터를 배열로 변환
    const dailySignupsData = Object.values(dailySignups);
    
    // 대학별 가입자 데이터를 배열로 변환 및 정렬
    const universitySignupsData = Object.entries(universitySignups)
      .map(([university, stats]) => ({
        university,
        ...stats,
        femalePercentage: parseFloat((stats.female / stats.total * 100 || 0).toFixed(2))
      }))
      .sort((a, b) => b.total - a.total);
    
    // 친구 초대 코드 데이터 처리
    const referralData = Object.entries(referralCounts)
      .map(([code, count]) => ({
        referralCode: code,
        count,
        isFemaleReferrer: femaleReferralCodes.has(code)
      }))
      .sort((a, b) => b.count - a.count);
    
    // 성별 총계
    const genderTotals = signups.reduce(
      (acc, curr) => {
        acc.total += 1;
        if (curr.gender === 'male') acc.male += 1;
        else if (curr.gender === 'female') acc.female += 1;
        return acc;
      },
      { total: 0, male: 0, female: 0 }
    );
    
    // 여성 비율 계산
    const femalePercentage = parseFloat((genderTotals.female / genderTotals.total * 100 || 0).toFixed(2));
    
    return NextResponse.json({
      periodType: period,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      totalSignups: genderTotals.total,
      maleSignups: genderTotals.male,
      femaleSignups: genderTotals.female,
      femalePercentage,
      dailySignups: dailySignupsData,
      universitySignups: universitySignupsData,
      referrals: referralData
    });
  } catch (error) {
    console.error('Error in signups API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
