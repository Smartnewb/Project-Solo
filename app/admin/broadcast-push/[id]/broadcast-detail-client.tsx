'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, Button, CircularProgress, Paper, Chip, Stack } from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { BroadcastSchedule } from '@/app/services/admin';
import { BROADCAST_STATUS_LABEL, BROADCAST_STATUS_COLOR } from '@/app/services/admin';
import { formatDateTimeKR } from '@/app/utils/formatters';

export default function BroadcastDetailClient() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [schedule, setSchedule] = useState<BroadcastSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    AdminService.pushBroadcast
      .getSchedule(id)
      .then((data) => {
        if (!cancelled) setSchedule(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!schedule?.targetGroupId) return;
    let cancelled = false;
    setGroupLoading(true);
    AdminService.pushGroups
      .get(schedule.targetGroupId)
      .then((group) => {
        if (!cancelled) setGroupName(group.name);
      })
      .catch(() => {
        if (!cancelled) setGroupName(null);
      })
      .finally(() => {
        if (!cancelled) setGroupLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [schedule?.targetGroupId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !schedule) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography color="error">예약 발송 정보를 불러오지 못했습니다.</Typography>
        <Button sx={{ mt: 2 }} onClick={() => router.push('/admin/broadcast-push')}>
          목록
        </Button>
      </Box>
    );
  }

  const targetLabel = !schedule.targetGroupId
    ? '전체 활성유저'
    : groupLoading
      ? '확인중...'
      : (groupName ?? '(그룹 정보를 불러올 수 없음)');

  return (
    <Box sx={{ maxWidth: 720 }}>
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
          예약 발송 상세
        </Typography>
        <Stack direction="row" spacing={1}>
          <Chip label={BROADCAST_STATUS_LABEL[schedule.status]} color={BROADCAST_STATUS_COLOR[schedule.status]} />
          <Button variant="outlined" onClick={() => router.push('/admin/broadcast-push')}>
            목록
          </Button>
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          문구
        </Typography>
        <Stack spacing={1.5}>
          <Row label="KR 제목" value={schedule.krTitle} />
          <Row label="KR 본문" value={schedule.krBody} />
          <Row label="JP 제목" value={schedule.jpTitle} />
          <Row label="JP 본문" value={schedule.jpBody} />
          <Row label="딥링크" value={schedule.deepLink ?? '-'} />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          발송 정보
        </Typography>
        <Stack spacing={1.5}>
          <Row label="대상" value={targetLabel} />
          <Row label="예정시각" value={formatDateTimeKR(schedule.scheduledAt)} />
          <Row label="예상 대상 인원" value={`${schedule.targetPreviewCount.toLocaleString()}명`} />
          <Row label="성공" value={`${schedule.sentCount}`} />
          <Row label="실패" value={`${schedule.failedCount}`} />
          <Row label="발송 시각" value={schedule.sentAt ? formatDateTimeKR(schedule.sentAt) : '-'} />
          <Row label="등록자" value={schedule.createdBy ?? '-'} />
          <Row label="등록일" value={formatDateTimeKR(schedule.createdAt)} />
        </Stack>
      </Paper>
    </Box>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 140, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}
