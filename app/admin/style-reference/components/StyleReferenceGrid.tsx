'use client';

import { Box, CircularProgress, Grid, Pagination, Typography } from '@mui/material';
import type { StyleReferenceItem } from '@/app/services/admin';
import { StyleReferenceCard } from './StyleReferenceCard';

interface StyleReferenceGridProps {
  items: StyleReferenceItem[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  loadingId?: string;
  onPageChange: (page: number) => void;
  onDeactivate: (id: string) => void;
  onReactivate: (id: string) => void;
}

export function StyleReferenceGrid({
  items,
  total,
  page,
  pageSize,
  isLoading,
  loadingId,
  onPageChange,
  onDeactivate,
  onReactivate,
}: StyleReferenceGridProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (items.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <Typography color="text.secondary">등록된 이미지가 없습니다.</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={1.5}>
        {items.map((item) => (
          <Grid item key={item.id} xs={12} sm={6} md={4} lg={3} xl={2.4}>
            <StyleReferenceCard
              item={item}
              onDeactivate={onDeactivate}
              onReactivate={onReactivate}
              isLoading={loadingId === item.id}
            />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, p) => onPageChange(p)}
            color="primary"
            size="small"
          />
          <Typography variant="caption" color="text.secondary">
            총 {total}개 · 페이지 {page}/{totalPages}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
