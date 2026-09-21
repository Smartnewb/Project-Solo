'use client';

import { Alert, Box, Grid, Typography } from '@mui/material';
import { useDashboardSummary } from './hooks';
import ActionableInsights from './components/ActionableInsights';
import ActionRequired from './components/ActionRequired';
import GemSystemFunnel from './components/GemSystemFunnel';
import QuickAccess from './components/QuickAccess';
import RevenueOverview from './components/RevenueOverview';
import TodayMetrics from './components/TodayMetrics';
import UserEngagementStats from './components/UserEngagementStats';
import WeeklyTrend from './components/WeeklyTrend';

export default function DashboardV2() {

  const { data: summary, isLoading, error } = useDashboardSummary();

  const today = new Date();
  const formattedDate = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <Box className="min-h-screen bg-gray-50">
      <Box className="bg-white shadow-sm border-b border-gray-200">
        <Box className="max-w-7xl mx-auto px-4 py-4">
          <Box className="flex items-center justify-between">
            <Box>
              <Typography variant="h5" fontWeight="bold" color="textPrimary">
                메인 대시보드
              </Typography>
              <Typography variant="body2" color="textSecondary">
                오늘 해야 할 일을 한눈에 확인하세요
              </Typography>
            </Box>
            <Typography variant="body2" color="textSecondary">
              {formattedDate}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <Alert severity="error">
            대시보드 데이터를 불러오는데 실패했습니다.
          </Alert>
        )}

        <ActionRequired />

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <TodayMetrics kpi={summary?.kpi ?? null} loading={isLoading} />
            <Box sx={{ mt: 3 }}>
              <WeeklyTrend compact />
            </Box>
          </Grid>
          <Grid item xs={12} md={5}>
            <RevenueOverview kpi={summary?.kpi ?? null} loading={isLoading} />
          </Grid>
        </Grid>

        <GemSystemFunnel />
        <UserEngagementStats />
        <ActionableInsights />
        <QuickAccess />
      </Box>
    </Box>
  );
}
