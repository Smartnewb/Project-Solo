'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import AdminService from '@/app/services/admin';

export default function DailySignupsCard() {
  const [dailySignups, setDailySignups] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDailySignups = async () => {
      try {
        setLoading(true);
        const data = await AdminService.stats.getDailySignupCount();
        setDailySignups(data.dailySignups);
        setError(null);
      } catch (err) {
        console.error('오늘 가입한 회원 수 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchDailySignups();
    // 1분마다 데이터 갱신
    const interval = setInterval(fetchDailySignups, 60000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          오늘의 신규 가입
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
            {dailySignups?.toLocaleString() || 0}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
