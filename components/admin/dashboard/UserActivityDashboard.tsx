'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Box,
  CircularProgress,
  Alert,
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
  ResponsiveContainer
} from 'recharts';
import AdminService from '@/app/services/admin';

// 사용자 활동 지표 대시보드 컴포넌트
export default function UserActivityDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  // 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API 호출
        const response = await AdminService.stats.getUserActivityStats();
        console.log('사용자 활동 지표 응답:', response);
        
        // 데이터 설정
        setStats(response);
      } catch (error: any) {
        console.error('사용자 활동 지표 조회 중 오류:', error);
        setError(
          error.response?.data?.message ||
          error.message ||
          '사용자 활동 지표를 불러오는 중 오류가 발생했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 시간대별 활성 사용자 분포 데이터 변환
  const getHourlyDistributionData = () => {
    if (!stats?.hourlyDistribution) return [];
    
    // 객체를 배열로 변환하여 안전하게 처리
    return Object.entries(stats.hourlyDistribution).map(([hour, count]) => {
      // count가 객체인 경우 숫자로 변환
      const countValue = typeof count === 'object' ?
        (count && typeof count.count === 'number' ? count.count : 0) :
        (typeof count === 'number' ? count : 0);
      
      return {
        hour: `${hour}시`,
        활성사용자: countValue
      };
    });
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          사용자 활동 지표
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && !stats && (
          <Alert severity="info" sx={{ mb: 2 }}>
            사용자 활동 지표 데이터가 없습니다.
          </Alert>
        )}

        {!loading && !error && stats && (
          <Grid container spacing={3}>
            {/* 주요 활동 지표 */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  주요 활동 지표
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">활성 사용자 수</Typography>
                      <Typography variant="h5">{(typeof stats.activeUsers === 'number' ? stats.activeUsers : 0).toLocaleString()}명</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">실시간 활성 사용자</Typography>
                      <Typography variant="h5">{(typeof stats.realtimeActiveUsers === 'number' ? stats.realtimeActiveUsers : 0).toLocaleString()}명</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">MAU</Typography>
                      <Typography variant="h6">{(typeof stats.mau === 'number' ? stats.mau : 0).toLocaleString()}명</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">WAU</Typography>
                      <Typography variant="h6">{(typeof stats.wau === 'number' ? stats.wau : 0).toLocaleString()}명</Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">DAU</Typography>
                      <Typography variant="h6">{(typeof stats.dau === 'number' ? stats.dau : 0).toLocaleString()}명</Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* 활성화율 및 Stickiness */}
            <Grid item xs={12} md={6}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  활성화율 및 Stickiness
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">활성화율</Typography>
                      <Typography variant="h5">{(typeof stats.activationRate === 'number' ? stats.activationRate : 0).toFixed(1)}%</Typography>
                      <Typography variant="caption" color="text.secondary">
                        전체 사용자 중 활성 사용자 비율
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 1 }}>
                      <Typography variant="body2" color="text.secondary">Stickiness</Typography>
                      <Typography variant="h5">{(typeof stats.stickiness === 'number' ? stats.stickiness : 0).toFixed(1)}%</Typography>
                      <Typography variant="caption" color="text.secondary">
                        DAU/MAU 비율
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* 시간대별 활성 사용자 분포 */}
            <Grid item xs={12}>
              <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom>
                  시간대별 활성 사용자 분포
                </Typography>
                <Box sx={{ height: 300, mt: 2 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={getHourlyDistributionData()}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="활성사용자" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
