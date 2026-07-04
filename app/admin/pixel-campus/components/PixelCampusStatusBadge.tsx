'use client';

import { Chip } from '@mui/material';
import type { PixelCampusEpisodeStatus } from '@/types/admin';
import { STATUS_LABELS } from '../constants';

const STATUS_COLORS: Record<
  PixelCampusEpisodeStatus,
  'default' | 'warning' | 'info' | 'success'
> = {
  draft: 'default',
  in_review: 'warning',
  scheduled: 'info',
  published: 'success',
  archived: 'default',
};

interface Props {
  status: PixelCampusEpisodeStatus;
}

export function PixelCampusStatusBadge({ status }: Props) {
  return (
    <Chip
      label={STATUS_LABELS[status] ?? status}
      size="small"
      color={STATUS_COLORS[status] ?? 'default'}
      variant={status === 'archived' ? 'outlined' : 'filled'}
    />
  );
}
