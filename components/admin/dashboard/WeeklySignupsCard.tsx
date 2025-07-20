'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import AdminService from '@/app/services/admin';
import { getRegionLabel } from '@/components/admin/common/RegionFilter';

interface WeeklySignupsCardProps {
  region?: string;
}

export default function WeeklySignupsCard({ region }: WeeklySignupsCardProps) {
  const [weeklySignups, setWeeklySignups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region ? getRegionLabel(region as any) : '전체 지역';

  useEffect(() => {
    const fetchWeeklySignups = async () => {
      try {
        setLoading(true);
        const data = await AdminService.stats.getWeeklySignupCount(region);
        setWeeklySignups(data.weeklySignups);
        setError(null);
      } catch (err) {
        console.error('이번 주 가입한 회원 수 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklySignups();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchWeeklySignups, 60000);

    return () => clearInterval(interval);
  }, [region]);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          이번 주 가입자 ({regionLabel})
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
          <Typography variant="h4">
            {weeklySignups?.toLocaleString() || 0}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
