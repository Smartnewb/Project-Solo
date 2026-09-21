'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { PushTargetGroup, BroadcastSchedule } from '@/app/services/admin';
import { BROADCAST_STATUS_LABEL, BROADCAST_STATUS_COLOR } from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { formatDateTimeKR } from '@/app/utils/formatters';

export default function BroadcastHistoryClient() {
  const router = useRouter();
  const toast = useToast();

  const [schedules, setSchedules] = useState<BroadcastSchedule[]>([]);
  const [groups, setGroups] = useState<PushTargetGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([AdminService.pushBroadcast.listSchedules(), AdminService.pushGroups.list()])
      .then(([scheduleData, groupData]) => {
        if (cancelled) return;
        setSchedules(scheduleData);
        setGroups(groupData);
      })
      .catch(() => {
        if (!cancelled) toast.error('예약/발송 이력을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groupNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const group of groups) map[group.id] = group.name;
    return map;
  }, [groups]);

  const targetLabel = (schedule: BroadcastSchedule): string => {
    if (!schedule.targetGroupId) return '전체 활성유저';
    return groupNameById[schedule.targetGroupId] ?? '(알 수 없는 그룹)';
  };

  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          gap: 2,
          flexWrap: 'wrap',
        }}
      >
        <Typography variant="h5" fontWeight="bold">
          예약/발송 이력
        </Typography>
        <Button variant="contained" onClick={() => router.push('/admin/broadcast-push/new')}>
          새 예약 발송
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>제목</TableCell>
                <TableCell>대상</TableCell>
                <TableCell>예정시각</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>성공/실패</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {schedules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      등록된 예약/발송 이력이 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
              {schedules.map((schedule) => (
                <TableRow
                  key={schedule.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => router.push(`/admin/broadcast-push/${schedule.id}`)}
                >
                  <TableCell>{schedule.krTitle}</TableCell>
                  <TableCell>{targetLabel(schedule)}</TableCell>
                  <TableCell>{formatDateTimeKR(schedule.scheduledAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={BROADCAST_STATUS_LABEL[schedule.status]}
                      color={BROADCAST_STATUS_COLOR[schedule.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {schedule.sentCount}/{schedule.failedCount}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
