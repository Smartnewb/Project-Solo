'use client';

import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { useStyleReferenceStats } from '@/app/admin/hooks';
import { CATEGORY_LABELS, GENDER_LABELS } from '../constants';

export function StyleReferenceStats() {
  const { data, isLoading } = useStyleReferenceStats();

  const total = data?.stats?.reduce((acc, s) => acc + s.count, 0) ?? 0;
  const active = data?.stats?.reduce((acc, s) => acc + s.activeCount, 0) ?? 0;
  const inactive = total - active;

  const summaryCards = [
    { label: '전체', value: total, color: '#111827' },
    { label: '활성', value: active, color: '#059669' },
    { label: '비활성', value: inactive, color: '#dc2626' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      {summaryCards.map(({ label, value, color }) => (
        <Card key={label} variant="outlined" sx={{ minWidth: 100 }}>
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h5" fontWeight="bold" sx={{ color }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
          </CardContent>
        </Card>
      ))}
      {data?.stats?.map((s) => (
        <Card
          key={`${s.gender}-${s.category}`}
          variant="outlined"
          sx={{ minWidth: 120 }}
        >
          <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
            <Typography variant="h6" fontWeight="bold">
              {s.activeCount}
              <Typography component="span" variant="caption" color="text.secondary">
                /{s.count}
              </Typography>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {GENDER_LABELS[s.gender]} · {CATEGORY_LABELS[s.category]}
            </Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
