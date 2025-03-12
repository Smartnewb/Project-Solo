'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  UsersIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface AdminStats {
  totalUsers: number;
  totalMatches: number;
  reportedUsers: number;
  totalPosts: number;
  totalComments: number;
  reportedPosts: number;
  activeUsers: number;
  newUsersToday: number;
  matchesThisWeek: number;
  reportsThisWeek: number;
}

interface StatCardProps {
  title: string;
  value: number;
  trend?: 'up' | 'down';
  trendValue?: number;
}

const StatCard = ({ title, value, trend, trendValue }: StatCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <div className="mt-2 flex items-baseline">
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      {trend && trendValue && (
        <span className={`ml-2 text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          {trend === 'up' ? '+' : '-'}{trendValue}%
        </span>
      )}
    </div>
  </div>
);

interface ContentCardProps {
  title: string;
  value: number;
  description: string;
}

const ContentCard = ({ title, value, description }: ContentCardProps) => (
  <div className="bg-white p-6 rounded-xl shadow-sm">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    <p className="mt-1 text-sm text-gray-500">{description}</p>
  </div>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        router.push('/');
        return;
      }
    };

    checkAdmin();
  }, [router, supabase]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/admin/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
          <p className="mt-1 text-sm text-gray-500">실시간 서비스 통계를 확인하세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="전체 사용자"
            value={stats.totalUsers}
            trend="up"
            trendValue={5}
          />
          <StatCard
            title="오늘의 신규 가입"
            value={stats.newUsersToday}
          />
          <StatCard
            title="활성 사용자"
            value={stats.activeUsers}
          />
          <StatCard
            title="이번 주 매칭"
            value={stats.matchesThisWeek}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ContentCard
            title="총 매칭"
            value={stats.totalMatches}
            description="지금까지 성사된 총 매칭 수"
          />
          <ContentCard
            title="신고된 사용자"
            value={stats.reportedUsers}
            description="누적 신고된 사용자 수"
          />
          <ContentCard
            title="이번 주 신고"
            value={stats.reportsThisWeek}
            description="최근 7일간 접수된 신고"
          />
          <ContentCard
            title="게시글"
            value={stats.totalPosts}
            description="전체 게시글 수"
          />
          <ContentCard
            title="댓글"
            value={stats.totalComments}
            description="전체 댓글 수"
          />
          <ContentCard
            title="신고된 게시글"
            value={stats.reportedPosts}
            description="누적 신고된 게시글 수"
          />
        </div>
      </div>
    </div>
  );
} 