'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import AdminService from '@/app/services/admin';
import { getRegionLabel } from '@/components/admin/common/RegionFilter';

interface WithdrawalStatsCardProps {
  region?: string;
}

export default function WithdrawalStatsCard({ region }: WithdrawalStatsCardProps) {
  const [stats, setStats] = useState<{
    totalWithdrawals: number | null;
    dailyWithdrawals: number | null;
    weeklyWithdrawals: number | null;
    monthlyWithdrawals: number | null;
  }>({
    totalWithdrawals: null,
    dailyWithdrawals: null,
    weeklyWithdrawals: null,
    monthlyWithdrawals: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region ? getRegionLabel(region as any) : '전체 지역';

  useEffect(() => {
    const fetchWithdrawalStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬로 모든 API 호출
        try {
          const [totalResponse, dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
            AdminService.stats.getTotalWithdrawalsCount(region),
            AdminService.stats.getDailyWithdrawalCount(region),
            AdminService.stats.getWeeklyWithdrawalCount(),
            AdminService.stats.getMonthlyWithdrawalCount()
          ]);

          console.log('탈퇴 통계 응답:', { totalResponse, dailyResponse, weeklyResponse, monthlyResponse });

          // 응답 값이 유효한지 확인
          setStats({
            totalWithdrawals: totalResponse?.totalWithdrawals || 0,
            dailyWithdrawals: dailyResponse?.dailyWithdrawals || 0,
            weeklyWithdrawals: weeklyResponse?.weeklyWithdrawals || 0,
            monthlyWithdrawals: monthlyResponse?.monthlyWithdrawals || 0
          });
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // 오류 발생 시 기본값 설정
          setStats({
            totalWithdrawals: 0,
            dailyWithdrawals: 0,
            weeklyWithdrawals: 0,
            monthlyWithdrawals: 0
          });
        }
      } catch (err) {
        console.error('회원 탈퇴 통계 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWithdrawalStats();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchWithdrawalStats, 60000);

    return () => clearInterval(interval);
  }, [region]);

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
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          회원 탈퇴 통계 ({regionLabel})
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  총 탈퇴자 수
                </Typography>
                <Typography variant="h4">
                  {stats.totalWithdrawals !== null ? stats.totalWithdrawals.toLocaleString() : '로딩 중...'}
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
                  {stats.dailyWithdrawals !== null ? stats.dailyWithdrawals.toLocaleString() : '로딩 중...'}
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
                  {stats.weeklyWithdrawals !== null ? stats.weeklyWithdrawals.toLocaleString() : '로딩 중...'}
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
                  {stats.monthlyWithdrawals !== null ? stats.monthlyWithdrawals.toLocaleString() : '로딩 중...'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
