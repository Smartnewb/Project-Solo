'use client';

import { useState, useEffect, useCallback } from 'react';
import { Box, Typography, CircularProgress, Alert, Grid } from '@mui/material';
import { useRouter } from 'next/navigation';
import { dashboardService } from '@/app/services/dashboard';
import { DashboardSummaryResponse, Goal } from './types';

// 컴포넌트
import AlertBanner from './components/AlertBanner';
import ActionCards from './components/ActionCards';
import KPICards from './components/KPICards';
import UserMetricsCard from './components/UserMetricsCard';
import GoalProgressCard from './components/GoalProgressCard';
import MatchingFunnelChart from './components/MatchingFunnelChart';

export default function MainDashboard() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // 관리자 인증 확인
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        const token = localStorage.getItem('accessToken');
        const isAdmin = localStorage.getItem('isAdmin');

        if (!token || isAdmin !== 'true') {
          setAuthError('관리자 권한이 없습니다. 로그인 페이지로 이동합니다.');
          setTimeout(() => router.push('/'), 2000);
          return;
        }

        setAuthError(null);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setAuthError('인증 확인 중 오류가 발생했습니다.');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // 대시보드 데이터 로드
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Summary API 호출
      const summaryRes = await dashboardService.getSummary();
      setSummary(summaryRes);

      // Goals API는 별도로 호출 (실패해도 대시보드 표시)
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        const goalsRes = await dashboardService.getGoals(currentMonth);
        setGoals(goalsRes.goals || []);
      } catch (goalsErr) {
        console.warn('목표 데이터 조회 실패 (무시됨):', goalsErr);
        setGoals([]);
      }
    } catch (err) {
      console.error('대시보드 데이터 로딩 실패:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (authChecking || authError) return;

    fetchDashboardData();

    // 1분마다 자동 갱신
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, [authChecking, authError, fetchDashboardData]);

  // 알림 닫기
  const handleDismissAlert = (id: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(id));
  };

  // 목표 변경 시 리로드
  const handleGoalChange = () => {
    fetchDashboardData();
  };

  // 표시할 알림 필터링
  const visibleAlerts = summary?.alerts.filter(
    (alert) => !dismissedAlerts.has(alert.id)
  ) ?? [];

  // 인증 확인 중
  if (authChecking) {
    return (
      <Box className="flex items-center justify-center h-screen">
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          관리자 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  // 인증 오류
  if (authError) {
    return (
      <Box className="flex flex-col items-center justify-center h-screen">
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
        <Typography variant="body1">
          잠시 후 로그인 페이지로 이동합니다...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <Box className="bg-white shadow-sm border-b border-gray-200">
        <Box className="max-w-7xl mx-auto px-4 py-6">
          <Typography variant="h4" fontWeight="bold" color="textPrimary">
            메인 대시보드
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            주요 지표 및 액션 아이템을 한눈에 확인하세요
          </Typography>
        </Box>
      </Box>

      <Box className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* API 에러 표시 */}
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 알림 배너 */}
        {visibleAlerts.length > 0 && (
          <AlertBanner alerts={visibleAlerts} onDismiss={handleDismissAlert} />
        )}

        {/* 액션 카드 */}
        <ActionCards
          actionItems={summary?.actionItems ?? null}
          matching={summary?.matching ?? null}
          loading={loading}
        />

        {/* KPI 카드 */}
        <KPICards kpi={summary?.kpi ?? null} loading={loading} />

        {/* 사용자 현황 & 월간 목표 */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <UserMetricsCard kpi={summary?.kpi ?? null} loading={loading} />
          </Grid>
          <Grid item xs={12} md={6}>
            <GoalProgressCard
              goals={goals}
              loading={loading}
              onGoalChange={handleGoalChange}
            />
          </Grid>
        </Grid>

        {/* 매칭 퍼널 차트 */}
        <MatchingFunnelChart />
      </Box>
    </Box>
  );
}
