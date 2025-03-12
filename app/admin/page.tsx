'use client';

import { useState, useEffect } from 'react';
import {
  UsersIcon,
  HeartIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalUsers: number;
  newUsers: {
    today: number;
    weekly: number;
    monthly: number;
  };
  activeMatching: number;
  matchingSuccess: number;
  communityStats: {
    posts: number;
    comments: number;
    reports: number;
  };
  reportedUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 12345,
    newUsers: {
      today: 245,
      weekly: 1234,
      monthly: 5678,
    },
    activeMatching: 342,
    matchingSuccess: 78,
    communityStats: {
      posts: 58,
      comments: 234,
      reports: 5,
    },
    reportedUsers: 12,
  });

  const StatCard = ({
    title,
    value,
    icon: Icon,
    change,
    changeType = 'up',
  }: {
    title: string;
    value: number | string;
    icon: any;
    change?: number;
    changeType?: 'up' | 'down';
  }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-primary-50 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-primary-DEFAULT" />
        </div>
        {change !== undefined && (
          <div
            className={`flex items-center gap-1 text-sm ${
              changeType === 'up' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {changeType === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4" />
            )}
            <span>{change}%</span>
          </div>
        )}
      </div>
      <h3 className="text-gray-500 text-sm mb-2">{title}</h3>
      <p className="text-2xl font-bold">{value.toLocaleString()}</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">대시보드</h1>
        <p className="text-sm text-gray-500">
          최근 업데이트: {new Date().toLocaleString()}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="총 가입자 수"
          value={stats.totalUsers}
          icon={UsersIcon}
          change={5}
          changeType="up"
        />
        <StatCard
          title="진행 중인 매칭"
          value={stats.activeMatching}
          icon={HeartIcon}
          change={2}
          changeType="up"
        />
        <StatCard
          title="매칭 성공률"
          value={`${stats.matchingSuccess}%`}
          icon={HeartIcon}
          change={3}
          changeType="up"
        />
        <StatCard
          title="신고된 유저"
          value={stats.reportedUsers}
          icon={ExclamationTriangleIcon}
          change={1}
          changeType="down"
        />
      </div>

      {/* 신규 가입자 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-4">오늘의 신규 가입자</h3>
          <p className="text-2xl font-bold">{stats.newUsers.today.toLocaleString()}명</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-4">이번 주 신규 가입자</h3>
          <p className="text-2xl font-bold">{stats.newUsers.weekly.toLocaleString()}명</p>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="text-gray-500 text-sm mb-4">이번 달 신규 가입자</h3>
          <p className="text-2xl font-bold">{stats.newUsers.monthly.toLocaleString()}명</p>
        </div>
      </div>

      {/* 커뮤니티 통계 */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4">커뮤니티 현황</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-gray-500 text-sm mb-2">오늘의 게시글</h3>
            <p className="text-2xl font-bold">{stats.communityStats.posts.toLocaleString()}개</p>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm mb-2">오늘의 댓글</h3>
            <p className="text-2xl font-bold">{stats.communityStats.comments.toLocaleString()}개</p>
          </div>
          <div>
            <h3 className="text-gray-500 text-sm mb-2">신고된 게시물</h3>
            <p className="text-2xl font-bold">{stats.communityStats.reports.toLocaleString()}개</p>
          </div>
        </div>
      </div>
    </div>
  );
} 