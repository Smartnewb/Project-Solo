'use client';

import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { hooks } from '@/lib/query';

export default function DailySignupsCard() {
  // React Query 훅 사용
  const { data, isLoading, error } = hooks.useDashboardData();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          오늘의 신규 가입
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="40px">
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Typography color="error" variant="body2">
            데이터를 불러오는데 실패했습니다.
          </Typography>
        ) : (
          <Typography variant="h4">
            {(data?.overview?.newUsers || 0).toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
