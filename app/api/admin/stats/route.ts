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

    // 전체 사용자 수
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // 오늘 새로 가입한 사용자 수
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: newUsersToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 전체 매칭 수
    const { count: totalMatches } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    // 이번 주 매칭 수
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const { count: matchesThisWeek } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // 신고된 사용자 수
    const { count: reportedUsers } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true });

    // 이번 주 신고 수
    const { count: reportsThisWeek } = await supabase
      .from('user_reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    // 게시글 통계
    const { count: totalPosts } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true });

    const { count: reportedPosts } = await supabase
      .from('post_reports')
      .select('*', { count: 'exact', head: true });

    // 댓글 통계
    const { count: totalComments } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    // 활성 사용자 수 (24시간 이내 활동)
    const dayAgo = new Date();
    dayAgo.setDate(dayAgo.getDate() - 1);
    const { count: activeUsers } = await supabase
      .from('user_activities')
      .select('*', { count: 'exact', head: true })
      .gte('last_activity', dayAgo.toISOString());

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalMatches: totalMatches || 0,
      reportedUsers: reportedUsers || 0,
      totalPosts: totalPosts || 0,
      totalComments: totalComments || 0,
      reportedPosts: reportedPosts || 0,
      activeUsers: activeUsers || 0,
      newUsersToday: newUsersToday || 0,
      matchesThisWeek: matchesThisWeek || 0,
      reportsThisWeek: reportsThisWeek || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
} 