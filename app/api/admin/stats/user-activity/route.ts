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

    // MAU (Monthly Active Users) 계산
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const { count: mau, error: mauError } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', monthAgo.toISOString());
    
    if (mauError) {
      console.error('Error fetching MAU:', mauError);
    }
    
    // DAU (Daily Active Users) 계산
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    
    const { count: dau, error: dauError } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', dayAgo.toISOString());
    
    if (dauError) {
      console.error('Error fetching DAU:', dauError);
    }
    
    // 총 회원 수
    const { count: totalUsers, error: totalUsersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (totalUsersError) {
      console.error('Error fetching total users:', totalUsersError);
    }
    
    // DAU/MAU 비율 계산
    const dauMauRatio = mau ? parseFloat(((dau || 0) / mau * 100).toFixed(2)) : 0;
    
    // 프로필 완성도 분석
    const { data: profileCompletionData, error: profileCompletionError } = await supabase
      .from('profiles')
      .select('profile_completion');
    
    if (profileCompletionError) {
      console.error('Error fetching profile completion data:', profileCompletionError);
    }
    
    // 프로필 완성도 단계별 분류
    const profileCompletionStages = {
      notStarted: 0,  // 0%
      basic: 0,       // 1-25%
      partial: 0,     // 26-50%
      mostlyComplete: 0, // 51-75%
      complete: 0,    // 76-100%
    };
    
    profileCompletionData?.forEach(profile => {
      const completion = profile.profile_completion || 0;
      
      if (completion === 0) {
        profileCompletionStages.notStarted += 1;
      } else if (completion <= 25) {
        profileCompletionStages.basic += 1;
      } else if (completion <= 50) {
        profileCompletionStages.partial += 1;
      } else if (completion <= 75) {
        profileCompletionStages.mostlyComplete += 1;
      } else {
        profileCompletionStages.complete += 1;
      }
    });
    
    // 성별에 따른 프로필 완성도
    const { data: genderProfileData, error: genderProfileError } = await supabase
      .from('profiles')
      .select('gender, profile_completion');
    
    if (genderProfileError) {
      console.error('Error fetching gender profile data:', genderProfileError);
    }
    
    // 성별 프로필 완성도 평균 계산
    const genderProfileCompletion = {
      male: { total: 0, count: 0, average: 0 },
      female: { total: 0, count: 0, average: 0 }
    };
    
    genderProfileData?.forEach(profile => {
      if (!profile.gender) return;
      
      if (profile.gender === 'male') {
        genderProfileCompletion.male.total += profile.profile_completion || 0;
        genderProfileCompletion.male.count += 1;
      } else if (profile.gender === 'female') {
        genderProfileCompletion.female.total += profile.profile_completion || 0;
        genderProfileCompletion.female.count += 1;
      }
    });
    
    genderProfileCompletion.male.average = 
      genderProfileCompletion.male.count ? 
      parseFloat((genderProfileCompletion.male.total / genderProfileCompletion.male.count).toFixed(2)) : 0;
    
    genderProfileCompletion.female.average = 
      genderProfileCompletion.female.count ? 
      parseFloat((genderProfileCompletion.female.total / genderProfileCompletion.female.count).toFixed(2)) : 0;
    
    // 주간 재방문율 (Weekly Return Rate) 계산
    // 이는 지난 주에 방문한 사용자 중 이번 주에도 방문한 사용자의 비율
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    // 지난 주 활성 사용자
    const { data: lastWeekActiveUsers, error: lastWeekError } = await supabase
      .from('user_activities')
      .select('user_id')
      .gte('last_activity', twoWeeksAgo.toISOString())
      .lt('last_activity', oneWeekAgo.toISOString());
    
    if (lastWeekError) {
      console.error('Error fetching last week active users:', lastWeekError);
    }
    
    // 이번 주 활성 사용자
    const { data: thisWeekActiveUsers, error: thisWeekError } = await supabase
      .from('user_activities')
      .select('user_id')
      .gte('last_activity', oneWeekAgo.toISOString());
    
    if (thisWeekError) {
      console.error('Error fetching this week active users:', thisWeekError);
    }
    
    // 지난 주 활성 사용자 ID 세트
    const lastWeekActiveUserIds = new Set(lastWeekActiveUsers?.map(u => u.user_id) || []);
    
    // 재방문 사용자 수 계산
    let returningUsers = 0;
    thisWeekActiveUsers?.forEach(user => {
      if (lastWeekActiveUserIds.has(user.user_id)) {
        returningUsers += 1;
      }
    });
    
    // 주간 재방문율 계산
    const weeklyReturnRate = 
      lastWeekActiveUserIds.size ?
      parseFloat((returningUsers / lastWeekActiveUserIds.size * 100).toFixed(2)) : 0;
    
    return NextResponse.json({
      periodType: period,
      mau: mau || 0,
      dau: dau || 0,
      dauMauRatio,
      totalUsers: totalUsers || 0,
      mauPercentage: totalUsers ? parseFloat(((mau || 0) / totalUsers * 100).toFixed(2)) : 0,
      profileCompletionStages,
      genderProfileCompletion,
      weeklyReturnRate
    });
  } catch (error) {
    console.error('Error in user activity API:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
