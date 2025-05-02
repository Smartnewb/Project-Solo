'use client';

import { Card, CardContent, Typography, Box, CircularProgress } from '@mui/material';
import { hooks } from '@/lib/query';

export default function TotalMatchesCard() {
  // React Query 훅 사용
  const { data, isLoading, error } = hooks.useDashboardData();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography color="textSecondary" gutterBottom>
          총 매칭 수
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
            {(data?.overview?.totalMatches || 0).toLocaleString()}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
