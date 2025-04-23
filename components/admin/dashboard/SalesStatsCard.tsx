'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Grid } from '@mui/material';
import AdminService from '@/app/services/admin';

export default function SalesStatsCard() {
  const [stats, setStats] = useState<{
    totalSales: number;
    totalCount: number;
    dailySales: number;
    dailyCount: number;
    weeklySales: number;
    weeklyCount: number;
    monthlySales: number;
    monthlyCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalesStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬로 모든 API 호출
        try {
          const [totalResponse, dailyResponse, weeklyResponse, monthlyResponse] = await Promise.all([
            AdminService.sales.getTotalSales(),
            AdminService.sales.getDailySales(),
            AdminService.sales.getWeeklySales(),
            AdminService.sales.getMonthlySales()
          ]);

          console.log('매출 통계 응답:', { totalResponse, dailyResponse, weeklyResponse, monthlyResponse });

          // 응답 값이 유효한지 확인
          setStats({
            totalSales: totalResponse?.totalSales || 0,
            totalCount: totalResponse?.totalCount || 0,
            dailySales: dailyResponse?.dailySales || 0,
            dailyCount: dailyResponse?.dailyCount || 0,
            weeklySales: weeklyResponse?.weeklySales || 0,
            weeklyCount: weeklyResponse?.weeklyCount || 0,
            monthlySales: monthlyResponse?.monthlySales || 0,
            monthlyCount: monthlyResponse?.monthlyCount || 0
          });
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // 오류 발생 시 기본값 설정
          setStats({
            totalSales: 0,
            totalCount: 0,
            dailySales: 0,
            dailyCount: 0,
            weeklySales: 0,
            weeklyCount: 0,
            monthlySales: 0,
            monthlyCount: 0
          });
        }
      } catch (err) {
        console.error('매출 통계 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSalesStats();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchSalesStats, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 금액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              총 매출액
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="40px">
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : (
              <>
                <Typography variant="h4">
                  {formatCurrency(stats?.totalSales || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  총 {stats?.totalCount || 0}건
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              오늘 매출액
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="40px">
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : (
              <>
                <Typography variant="h4">
                  {formatCurrency(stats?.dailySales || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  오늘 {stats?.dailyCount || 0}건
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              이번 주 매출액
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="40px">
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : (
              <>
                <Typography variant="h4">
                  {formatCurrency(stats?.weeklySales || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  이번 주 {stats?.weeklyCount || 0}건
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card variant="outlined">
          <CardContent>
            <Typography color="textSecondary" gutterBottom>
              이번 달 매출액
            </Typography>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="40px">
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            ) : (
              <>
                <Typography variant="h4">
                  {formatCurrency(stats?.monthlySales || 0)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  이번 달 {stats?.monthlyCount || 0}건
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
