'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Grid } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import AdminService from '@/app/services/admin';

interface DailySuccessRate {
  date: string;
  attempts: number;
  success: number;
  rate: number;
}

interface SuccessRateData {
  totalAttempts: number;
  successCount: number;
  failCount: number;
  successRate: number;
  dailySuccessRate: DailySuccessRate[];
}

export default function PaymentSuccessRateCard() {
  const [data, setData] = useState<SuccessRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSuccessRate = async () => {
      try {
        setLoading(true);
        const response = await AdminService.sales.getPaymentSuccessRate();
        setData(response);
        setError(null);
      } catch (err) {
        console.error('결제 성공률 조회 중 오류:', err);
        setError('결제 성공률 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessRate();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchSuccessRate, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // 색상 결정 함수
  const getBarColor = (rate: number) => {
    if (rate >= 95) return '#4caf50'; // 높은 성공률 - 녹색
    if (rate >= 85) return '#2196f3'; // 중간 성공률 - 파란색
    return '#ff9800'; // 낮은 성공률 - 주황색
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          결제 성공률
        </Typography>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="300px">
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor="#f5f5f5" borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">총 결제 시도</Typography>
                  <Typography variant="h5">{data?.totalAttempts || 0}건</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor="#e8f5e9" borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">성공</Typography>
                  <Typography variant="h5" color="success.main">{data?.successCount || 0}건</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor="#ffebee" borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">실패</Typography>
                  <Typography variant="h5" color="error.main">{data?.failCount || 0}건</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box textAlign="center" p={2} bgcolor="#e3f2fd" borderRadius={1}>
                  <Typography variant="body2" color="textSecondary">성공률</Typography>
                  <Typography variant="h5" color="primary.main">{data?.successRate?.toFixed(2) || 0}%</Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3 }}>
              최근 7일간 일별 결제 성공률
            </Typography>

            <Box sx={{ height: 300, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.dailySuccessRate || []}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'rate') return [`${value}%`, '성공률'];
                      if (name === 'attempts') return [value, '시도 건수'];
                      if (name === 'success') return [value, '성공 건수'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="rate" name="성공률" fill="#8884d8">
                    {(data?.dailySuccessRate || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.rate)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}
