import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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
    if (user.email !== 'admin@smartnewbie.com') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 현재 날짜 설정
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // 일별 방문자 수 (최근 30일)
    const { data: dailyVisits } = await supabase
      .from('visit_logs')
      .select('date, count')
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: true });

    // 시간대별 사용자 수
    const { data: hourlyActivity } = await supabase
      .from('hourly_activity')
      .select('hour, count')
      .order('hour', { ascending: true });

    // 최근 30일간 일별 회원가입자 수
    const { data: dailySignups } = await supabase
      .from('daily_signups')
      .select('date, count')
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: true });

    // 누적 가입자 수 (월별)
    const { data: cumulativeUsers } = await supabase
      .from('monthly_user_growth')
      .select('month, total')
      .order('month', { ascending: true });

    // 평균 접속 시간
    const { data: avgSessionDuration } = await supabase
      .from('session_analytics')
      .select('date, avg_duration_minutes')
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: true });

    // 기기별 사용자 비율
    const { data: deviceStats } = await supabase
      .from('device_stats')
      .select('device_type, count')
      .order('count', { ascending: false });

    // 사용자 활동 통계
    const { data: userActivity, error: userActivityError } = await supabase
      .from('user_activities')
      .select('last_activity')
      .gte('last_activity', thirtyDaysAgo.toISOString());

    if (userActivityError) {
      console.error('Error fetching user activity:', userActivityError);
    }

    // 전체 사용자 수
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 오늘 방문자 수
    const { count: todayVisitors } = await supabase
      .from('visit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('date', today.toISOString().split('T')[0]);

    // 이번 주 방문자 수
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: weeklyVisitors } = await supabase
      .from('visit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('date', weekAgo.toISOString().split('T')[0]);

    // 이번 달 방문자 수
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    const { count: monthlyVisitors } = await supabase
      .from('visit_logs')
      .select('*', { count: 'exact', head: true })
      .gte('date', monthAgo.toISOString().split('T')[0]);

    // 활성 사용자 수 (24시간 이내 활동)
    const dayAgo = new Date(now);
    dayAgo.setDate(dayAgo.getDate() - 1);
    const { count: activeUsers } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', dayAgo.toISOString());

    return NextResponse.json({
      dailyVisits: dailyVisits || [],
      hourlyActivity: hourlyActivity || [],
      dailySignups: dailySignups || [],
      cumulativeUsers: cumulativeUsers || [],
      avgSessionDuration: avgSessionDuration || [],
      deviceStats: deviceStats || [],
      
      // 요약 통계
      dailyVisitorsCount: todayVisitors || 0,
      weeklyVisitorsCount: weeklyVisitors || 0, 
      monthlyVisitorsCount: monthlyVisitors || 0,
      activeUsersCount: activeUsers || 0,
      totalUsersCount: totalUsers || 0,
      
      // 현재 페이지를 보는 날짜 기준
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching traffic stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 