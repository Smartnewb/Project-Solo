'use client';

import { useState } from 'react';
import { Grid, Card, CardContent, Typography, Box, Alert, CircularProgress, Divider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { hooks } from '@/lib/query';

// 대시보드 컴포넌트 가져오기
import TotalUsersCard from '@/components/admin/dashboard/TotalUsersCard';
import DailySignupsCard from '@/components/admin/dashboard/DailySignupsCard';
import WeeklySignupsCard from '@/components/admin/dashboard/WeeklySignupsCard';
import TotalMatchesCard from '@/components/admin/dashboard/TotalMatchesCard';
import GenderStatsCard from '@/components/admin/dashboard/GenderStatsCard';
import UniversityStatsCard from '@/components/admin/dashboard/UniversityStatsCard';
import UserActivityDashboard from '@/components/admin/dashboard/UserActivityDashboard';
import SignupStatsDashboard from '@/components/admin/dashboard/SignupStatsDashboard';

// 회원 탈퇴 통계 컴포넌트
import WithdrawalStatsCard from '@/components/admin/dashboard/WithdrawalStatsCard';
import WithdrawalStatsDashboard from '@/components/admin/dashboard/WithdrawalStatsDashboard';
import WithdrawalReasonStats from '@/components/admin/dashboard/WithdrawalReasonStats';
import ServiceDurationStats from '@/components/admin/dashboard/ServiceDurationStats';
import ChurnRateStats from '@/components/admin/dashboard/ChurnRateStats';

export default function AdminDashboard() {
  // React Query 훅 사용
  const {
    data: dashboardData,
    isLoading,
    error,
    isError
  } = hooks.useDashboardData({
    // 에러 발생 시 재시도 옵션 추가
    retry: 1,
    retryDelay: 1000
  });

  // 에러 발생 시 에러 메시지 표시
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          대시보드 데이터를 불러오는 중 오류가 발생했습니다: {error instanceof Error ? error.message : '알 수 없는 오류'}
        </Alert>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          관리자 대시보드
        </Typography>

        {/* 로딩 중 표시 */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TotalUsersCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <WeeklySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DailySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TotalMatchesCard />
          </Grid>
        </Grid>

        {/* 성별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <GenderStatsCard />
        </Box>

        {/* 회원가입 통계 대시보드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <SignupStatsDashboard />
        </Box>

        {/* 대학별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <UniversityStatsCard />
        </Box>

        {/* 사용자 활동 지표 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <UserActivityDashboard />
        </Box>

        <Divider sx={{ my: 6 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 4 }}>
          회원 탈퇴 통계
        </Typography>

        {/* 회원 탈퇴 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalStatsCard />
        </Box>

        {/* 회원 탈퇴 추이 대시보드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalStatsDashboard />
        </Box>

        {/* 탈퇴 사유 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <WithdrawalReasonStats />
        </Box>

        {/* 서비스 사용 기간 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <ServiceDurationStats />
        </Box>

        {/* 이탈률 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <ChurnRateStats />
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
