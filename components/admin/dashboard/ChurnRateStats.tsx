'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList
} from 'recharts';
import AdminService from '@/app/services/admin';

export default function ChurnRateStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [churnRates, setChurnRates] = useState<{
    daily: number | null;
    weekly: number | null;
    monthly: number | null;
  }>({
    daily: null,
    weekly: null,
    monthly: null
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const response = await AdminService.stats.getChurnRate();
          console.log('이탈률 통계 응답:', response);

          if (response) {
            setChurnRates({
              daily: response.dailyChurnRate !== undefined ? response.dailyChurnRate : 0,
              weekly: response.weeklyChurnRate !== undefined ? response.weeklyChurnRate : 0,
              monthly: response.monthlyChurnRate !== undefined ? response.monthlyChurnRate : 0
            });
          } else {
            // 데이터가 없는 경우 기본 데이터 생성
            setChurnRates({
              daily: 0,
              weekly: 0,
              monthly: 0
            });
            setError('이탈률 데이터가 없습니다. 샘플 데이터를 표시합니다.');
          }
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // 오류 발생 시 기본 데이터 생성
          setChurnRates({
            daily: 0,
            weekly: 0,
            monthly: 0
          });
          setError('데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.');
        }
      } catch (err) {
        console.error('이탈률 통계 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    return [
      {
        name: '일간',
        이탈률: churnRates.daily || 0
      },
      {
        name: '주간',
        이탈률: churnRates.weekly || 0
      },
      {
        name: '월간',
        이탈률: churnRates.monthly || 0
      }
    ];
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            이탈률 통계
          </Typography>
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
          <Typography variant="h6" gutterBottom>
            이탈률 통계
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          이탈률 통계
        </Typography>

        <Grid container spacing={3}>
          {/* 바 차트 */}
          <Grid item xs={12}>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formatChartData()}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, Math.max(10, Math.ceil((Math.max(
                      churnRates.daily || 0,
                      churnRates.weekly || 0,
                      churnRates.monthly || 0
                    ) + 1) / 5) * 5)]}
                  />
                  <Tooltip formatter={(value: any) => [`${value.toFixed(2)}%`, '이탈률']} />
                  <Legend />
                  <Bar dataKey="이탈률" fill="#FF8042">
                    <LabelList dataKey="이탈률" position="top" formatter={(value: any) => `${value.toFixed(2)}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* 요약 카드 */}
          <Grid item xs={12} container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  일간 이탈률
                </Typography>
                <Typography variant="h4" color="error">
                  {churnRates.daily !== null ? `${churnRates.daily.toFixed(2)}%` : '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  최근 24시간 동안의 이탈률
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  주간 이탈률
                </Typography>
                <Typography variant="h4" color="error">
                  {churnRates.weekly !== null ? `${churnRates.weekly.toFixed(2)}%` : '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  최근 7일 동안의 이탈률
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Paper elevation={3} sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5' }}>
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  월간 이탈률
                </Typography>
                <Typography variant="h4" color="error">
                  {churnRates.monthly !== null ? `${churnRates.monthly.toFixed(2)}%` : '-'}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  최근 30일 동안의 이탈률
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
