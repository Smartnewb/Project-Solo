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
  Divider
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import AdminService from '@/app/services/admin';
import { getRegionLabel } from '@/components/admin/common/RegionFilter';

// API 응답 타입 정의
interface GenderStats {
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  malePercentage: number;
  femalePercentage: number;
  genderRatio: string;
}

interface GenderStatsCardProps {
  region?: string;
}

// 성별 통계 카드 컴포넌트
export default function GenderStatsCard({ region }: GenderStatsCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GenderStats | null>(null);

  // 지역 라벨 생성
  const regionLabel = region ? getRegionLabel(region as any) : '전체 지역';

  // 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await AdminService.stats.getGenderStats(region);
        console.log('성별 통계 응답:', response);

        setStats(response);
      } catch (error: any) {
        console.error('성별 통계 조회 중 오류:', error);
        setError(
          error.response?.data?.message ||
          error.message ||
          '데이터를 불러오는데 실패했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region]);

  // 차트 데이터 생성
  const chartData = stats ? [
    { name: '남성', value: stats.maleCount, ratio: stats.malePercentage },
    { name: '여성', value: stats.femaleCount, ratio: stats.femalePercentage }
  ] : [];

  // 차트 색상
  const COLORS = ['#0088FE', '#FF8042'];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          성별 통계 ({regionLabel})
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              데이터를 불러오는 중...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && stats && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, ratio }) => `${name} ${ratio?.toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value}명`, '회원 수']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                <Typography variant="h5" align="center" gutterBottom>
                  성비 비율: <strong>{stats?.genderRatio || '0:0'}</strong>
                </Typography>
                <Divider sx={{ my: 2 }} />
                <Typography variant="body1" sx={{ mb: 1 }}>
                  남성 회원: <strong>{stats?.maleCount?.toLocaleString() || '0'}명</strong> ({stats?.malePercentage?.toFixed(1) || 0}%)
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  여성 회원: <strong>{stats?.femaleCount?.toLocaleString() || '0'}명</strong> ({stats?.femalePercentage?.toFixed(1) || 0}%)
                </Typography>
                <Typography variant="body1">
                  전체 회원: <strong>{stats?.totalCount?.toLocaleString() || '0'}명</strong>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        )}
      </CardContent>
    </Card>
  );
}
