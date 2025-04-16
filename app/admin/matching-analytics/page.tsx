'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/utils/config';

interface MatchingStats {
  totalMatchRate: number;
  maleMatchRate: number;
  femaleMatchRate: number;
  totalRematchRate: number;
  maleRematchRate: number;
  femaleRematchRate: number;
  maleSecondRematchRate: number;
  femaleSecondRematchRate: number;
  maleThirdRematchRate: number;
  femaleThirdRematchRate: number;
}

export default function MatchingAnalytics() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // 임시 데이터
  const matchingStats: MatchingStats = {
    totalMatchRate: 75.5,
    maleMatchRate: 70.2,
    femaleMatchRate: 80.8,
    totalRematchRate: 45.3,
    maleRematchRate: 48.6,
    femaleRematchRate: 42.0,
    maleSecondRematchRate: 25.4,
    femaleSecondRematchRate: 22.8,
    maleThirdRematchRate: 12.3,
    femaleThirdRematchRate: 10.5,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (!user || (user.email !== process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL && user.email !== ADMIN_EMAIL)) {
    router.push('/');
    return null;
  }

  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-gray-600 text-sm font-medium mb-2">{title}</h3>
      <p className="text-3xl font-bold text-indigo-600">{value.toFixed(1)}%</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      {/* 헤더 */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">매칭 분석 대시보드</h1>
        </div>
      </div>

      {/* 필터 */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center space-x-4 mb-8">
          <span className="text-gray-700">기간 선택:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
            className="border rounded-lg px-4 py-2"
          >
            <option value="daily">일간</option>
            <option value="weekly">주간</option>
            <option value="monthly">월간</option>
          </select>
        </div>
      </div>

      {/* 매칭 성과 섹션 */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">매칭 성과</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="전체 매칭 성사율" value={matchingStats.totalMatchRate} />
          <StatCard title="남성 매칭 성사율" value={matchingStats.maleMatchRate} />
          <StatCard title="여성 매칭 성사율" value={matchingStats.femaleMatchRate} />
        </div>
      </div>

      {/* 재매칭 분석 섹션 */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-xl font-bold text-gray-900 mb-6">재매칭 분석</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="전체 재매칭 신청률" value={matchingStats.totalRematchRate} />
          <StatCard title="남성 재매칭 신청률" value={matchingStats.maleRematchRate} />
          <StatCard title="여성 재매칭 신청률" value={matchingStats.femaleRematchRate} />
          <StatCard title="남성 2차 재매칭 신청률" value={matchingStats.maleSecondRematchRate} />
          <StatCard title="여성 2차 재매칭 신청률" value={matchingStats.femaleSecondRematchRate} />
          <StatCard title="남성 3차 재매칭 신청률" value={matchingStats.maleThirdRematchRate} />
          <StatCard title="여성 3차 재매칭 신청률" value={matchingStats.femaleThirdRematchRate} />
        </div>
      </div>
    </div>
  );
} 