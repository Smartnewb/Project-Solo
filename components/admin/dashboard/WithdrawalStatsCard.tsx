'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { hooks } from '@/lib/query';

export default function WithdrawalStatsCard() {
  // React Query 훅 사용
  const { data, isLoading: loading, error } = hooks.useDashboardData();

  // 에러 메시지 처리
  const errorMessage = error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.';

  // 데이터 추출
  const stats = {
    totalWithdrawals: data?.withdrawals?.total || 0,
    dailyWithdrawals: data?.withdrawals?.daily || 0,
    weeklyWithdrawals: data?.withdrawals?.weekly || 0,
    monthlyWithdrawals: data?.withdrawals?.monthly || 0
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              데이터를 불러오는 중...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">{errorMessage}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          회원 탈퇴 통계
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  총 탈퇴자 수
                </Typography>
                <Typography variant="h4">
                  {stats.totalWithdrawals.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  오늘 탈퇴자 수
                </Typography>
                <Typography variant="h4">
                  {stats.dailyWithdrawals.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  이번 주 탈퇴자 수
                </Typography>
                <Typography variant="h4">
                  {stats.weeklyWithdrawals.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  이번 달 탈퇴자 수
                </Typography>
                <Typography variant="h4">
                  {stats.monthlyWithdrawals.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
