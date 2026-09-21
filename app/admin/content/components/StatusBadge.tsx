'use client';

import { Chip } from '@mui/material';
import type { ContentStatus } from '@/types/admin';

interface Props {
  status: ContentStatus;
  scheduledAt?: string | null;
  expiresAt?: string | null;
}

export function StatusBadge({ status, scheduledAt, expiresAt }: Props) {
  const now = new Date();
  if (status === 'archived') {
    return <Chip label="보관" size="small" variant="outlined" />;
  }
  if (status === 'draft') {
    if (scheduledAt && new Date(scheduledAt) > now) {
      return <Chip label="예약됨" size="small" color="warning" />;
    }
    return <Chip label="초안" size="small" color="default" />;
  }
  if (status === 'published') {
    if (expiresAt && new Date(expiresAt) < now) {
      return <Chip label="만료" size="small" color="secondary" />;
    }
    return <Chip label="게시중" size="small" color="success" />;
  }
  return <Chip label={status} size="small" />;
}
