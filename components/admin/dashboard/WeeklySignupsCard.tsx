'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import AdminService from '@/app/services/admin';

export default function WeeklySignupsCard() {
  const [weeklySignups, setWeeklySignups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeeklySignups = async () => {
      try {
        setLoading(true);
        const data = await AdminService.stats.getWeeklySignupCount();
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
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          이번 주 가입자
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
