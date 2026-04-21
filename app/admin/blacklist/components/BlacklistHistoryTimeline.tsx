'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { RotateCcw, Clock } from 'lucide-react';
import { blacklist, type BlacklistHistoryEntry } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import { AdminNameLabel } from './AdminNameLabel';

interface Props {
  userId: string;
  onRelease?: (entry: BlacklistHistoryEntry) => void;
}

function durationDays(start: string, end: string): number {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)));
}

export function BlacklistHistoryTimeline({ userId, onRelease }: Props) {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['blacklist-history', userId],
    queryFn: () => blacklist.getHistory(userId),
    enabled: !!userId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">{getAdminErrorMessage(error, '이력 조회 실패')}</Alert>
    );
  }

  const history = data?.data?.history ?? [];
  const total = history.length;
  const activeCount = history.filter((h) => h.releasedAt === null).length;

  if (total === 0) {
    return (
      <Box py={4} textAlign="center">
        <Clock size={28} color="#9ca3af" style={{ display: 'inline-block' }} />
        <Typography color="text.secondary" mt={1}>
          블랙리스트 이력 없음
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={2}>
        <Typography variant="body2" color="text.secondary">
          전체 {total}건 · 활성 {activeCount}건
        </Typography>
      </Box>

      <Box display="flex" flexDirection="column" gap={2}>
        {history.map((entry) => {
          const isActive = entry.releasedAt === null;
          const barColor = isActive ? '#dc2626' : '#9ca3af';
          const duration = entry.releasedAt
            ? durationDays(entry.blacklistedAt, entry.releasedAt)
            : null;

          return (
            <Box
              key={entry.id}
              sx={{
                display: 'flex',
                gap: 1.5,
                p: 2,
                borderRadius: 1,
                bgcolor: '#f9fafb',
                borderLeft: `4px solid ${barColor}`,
              }}
            >
              <Box flex={1}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Chip
                    size="small"
                    label={isActive ? '활성' : '해제됨'}
                    color={isActive ? 'error' : 'default'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTimeWithoutTimezoneConversion(entry.blacklistedAt)}
                    {entry.releasedAt && (
                      <>
                        {' → '}
                        {formatDateTimeWithoutTimezoneConversion(entry.releasedAt)}
                        {duration !== null && ` · ${duration}일 지속`}
                      </>
                    )}
                  </Typography>
                </Box>

                <Box mb={1}>
                  <Typography variant="body2" fontWeight={600} component="span">
                    사유:{' '}
                  </Typography>
                  <Typography variant="body2" component="span" sx={{ whiteSpace: 'pre-wrap' }}>
                    {entry.reason}
                  </Typography>
                </Box>

                {entry.memo && (
                  <Box mb={1}>
                    <Typography variant="body2" fontWeight={600} component="span" color="text.secondary">
                      메모:{' '}
                    </Typography>
                    <Typography variant="body2" component="span" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {entry.memo}
                    </Typography>
                  </Box>
                )}

                <Typography variant="caption" color="text.secondary" component="div">
                  등록자: <AdminNameLabel adminId={entry.blacklistedBy} />
                </Typography>

                {entry.releasedAt && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    {entry.releaseReason && (
                      <Box mb={0.5}>
                        <Typography variant="body2" fontWeight={600} component="span" color="text.secondary">
                          해제 사유:{' '}
                        </Typography>
                        <Typography variant="body2" component="span" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                          {entry.releaseReason}
                        </Typography>
                      </Box>
                    )}
                    <Typography variant="caption" color="text.secondary" component="div">
                      해제자: <AdminNameLabel adminId={entry.releasedBy} />
                    </Typography>
                  </>
                )}

                {isActive && onRelease && (
                  <Box mt={1.5}>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<RotateCcw size={14} />}
                      onClick={() => onRelease(entry)}
                    >
                      해제하기
                    </Button>
                  </Box>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default BlacklistHistoryTimeline;
