'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  CircularProgress,
  Autocomplete,
  Stack,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type {
  PushTargetGroup,
  CreateBroadcastScheduleRequest,
  ScheduleCreatedResult,
} from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { formatDateTimeKR } from '@/app/utils/formatters';

const MAX_TITLE = 100;
const MAX_BODY = 500;

type TargetType = 'all' | 'group';

interface GroupPreviewState {
  loading: boolean;
  kr?: number;
  jp?: number;
  total?: number;
}

export default function BroadcastFormClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const { session } = useAdminSession();

  const [targetType, setTargetType] = useState<TargetType>('all');
  const [groups, setGroups] = useState<PushTargetGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<PushTargetGroup | null>(null);
  const [groupPreview, setGroupPreview] = useState<GroupPreviewState>({ loading: false });

  const [krTitle, setKrTitle] = useState('');
  const [krBody, setKrBody] = useState('');
  const [jpTitle, setJpTitle] = useState('');
  const [jpBody, setJpBody] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');

  const [testUserId, setTestUserId] = useState('');
  const [testSendingCountry, setTestSendingCountry] = useState<'kr' | 'jp' | null>(null);
  const [testConfirmed, setTestConfirmed] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScheduleCreatedResult | null>(null);

  useEffect(() => {
    if (session?.user?.id) setTestUserId(session.user.id);
  }, [session?.user?.id]);

  const handleGroupPreview = async (groupId: string) => {
    setGroupPreview({ loading: true });
    try {
      const preview = await AdminService.pushGroups.preview(groupId);
      setGroupPreview({ loading: false, kr: preview.kr, jp: preview.jp, total: preview.total });
    } catch (error) {
      setGroupPreview({ loading: false });
      toast.error(getAdminErrorMessage(error, '예상 대상자 수를 불러오지 못했습니다.'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    setGroupsLoading(true);
    AdminService.pushGroups
      .list()
      .then((data) => {
        if (cancelled) return;
        setGroups(data);
        const groupId = searchParams.get('groupId');
        if (groupId) {
          const found = data.find((g) => g.id === groupId);
          if (found) {
            setTargetType('group');
            setSelectedGroup(found);
            handleGroupPreview(found.id);
          }
        }
      })
      .catch(() => {
        if (!cancelled) toast.error('그룹 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (!cancelled) setGroupsLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectGroup = (group: PushTargetGroup | null) => {
    setSelectedGroup(group);
    setGroupPreview({ loading: false });
    if (group) handleGroupPreview(group.id);
  };

  const handleTestSend = async (country: 'kr' | 'jp') => {
    const title = country === 'kr' ? krTitle : jpTitle;
    const body = country === 'kr' ? krBody : jpBody;
    if (!testUserId.trim()) {
      toast.error('테스트 발송할 관리자 userId를 입력해주세요.');
      return;
    }
    if (!title.trim() || !body.trim()) {
      toast.error(`${country.toUpperCase()} 제목/본문을 먼저 입력해주세요.`);
      return;
    }
    setTestSendingCountry(country);
    try {
      const res = await AdminService.pushBroadcast.test({
        userId: testUserId.trim(),
        country,
        title: title.trim(),
        body: body.trim(),
        deepLink: deepLink.trim() || undefined,
      });
      if (res.success) {
        toast.success(`${country.toUpperCase()} 테스트 푸시를 발송했습니다.`);
      } else {
        toast.error(`${country.toUpperCase()} 테스트 푸시 발송에 실패했습니다.`);
      }
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '테스트 발송에 실패했습니다.'));
    } finally {
      setTestSendingCountry(null);
    }
  };

  const requiredTextFilled = Boolean(
    krTitle.trim() && krBody.trim() && jpTitle.trim() && jpBody.trim(),
  );
  const targetReady = targetType === 'all' || Boolean(selectedGroup);
  const canSubmit = requiredTextFilled && Boolean(scheduledAt) && testConfirmed && targetReady;

  const handleOpenConfirm = () => {
    if (!scheduledAt) {
      toast.error('발송 예정 시각을 입력해주세요.');
      return;
    }
    if (new Date(scheduledAt).getTime() <= Date.now()) {
      toast.error('발송 예정 시각은 현재 이후여야 합니다.');
      return;
    }
    if (!canSubmit) return;
    setConfirmOpen(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const body: CreateBroadcastScheduleRequest = {
        krTitle: krTitle.trim(),
        krBody: krBody.trim(),
        jpTitle: jpTitle.trim(),
        jpBody: jpBody.trim(),
        deepLink: deepLink.trim() || undefined,
        scheduledAt: new Date(scheduledAt).toISOString(),
        ...(targetType === 'group' && selectedGroup ? { targetGroupId: selectedGroup.id } : {}),
      };
      const created = await AdminService.pushBroadcast.schedule(body);
      setResult(created);
      setConfirmOpen(false);
    } catch (error) {
      toast.error(getAdminErrorMessage(error, '예약 등록에 실패했습니다.'));
    } finally {
      setSubmitting(false);
    }
  };

  const targetSummary =
    targetType === 'all'
      ? '전체 활성유저'
      : selectedGroup
        ? `${selectedGroup.name} (예상 ${groupPreview.total !== undefined ? `${groupPreview.total.toLocaleString()}명` : '확인중'})`
        : '-';

  return (
    <Box sx={{ maxWidth: 720 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
        예약 푸시 발송 등록
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">발송 대상</FormLabel>
          <RadioGroup
            row
            value={targetType}
            onChange={(e) => setTargetType(e.target.value as TargetType)}
          >
            <FormControlLabel value="all" control={<Radio />} label="전체 활성유저" />
            <FormControlLabel value="group" control={<Radio />} label="특정 그룹" />
          </RadioGroup>
        </FormControl>

        {targetType === 'group' && (
          <Box sx={{ mt: 2 }}>
            <Autocomplete
              options={groups}
              loading={groupsLoading}
              value={selectedGroup}
              getOptionLabel={(g) => `${g.name} (${g.type === 'static' ? '정적' : '동적'})`}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, value) => handleSelectGroup(value)}
              renderInput={(params) => <TextField {...params} label="타겟 그룹 선택" />}
            />
            {selectedGroup && (
              <Box sx={{ mt: 1 }}>
                {groupPreview.loading ? (
                  <CircularProgress size={16} />
                ) : groupPreview.total !== undefined ? (
                  <Typography variant="body2" color="text.secondary">
                    예상 대상자 수: KR {(groupPreview.kr ?? 0).toLocaleString()} · JP{' '}
                    {(groupPreview.jp ?? 0).toLocaleString()} · 합계{' '}
                    {groupPreview.total.toLocaleString()}명
                  </Typography>
                ) : null}
              </Box>
            )}
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          문구
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="KR 제목"
            required
            value={krTitle}
            onChange={(e) => setKrTitle(e.target.value)}
            inputProps={{ maxLength: MAX_TITLE }}
            helperText={`${krTitle.length}/${MAX_TITLE}`}
            fullWidth
          />
          <TextField
            label="KR 본문"
            required
            multiline
            minRows={3}
            value={krBody}
            onChange={(e) => setKrBody(e.target.value)}
            inputProps={{ maxLength: MAX_BODY }}
            helperText={`${krBody.length}/${MAX_BODY}`}
            fullWidth
          />
          <TextField
            label="JP 제목"
            required
            value={jpTitle}
            onChange={(e) => setJpTitle(e.target.value)}
            inputProps={{ maxLength: MAX_TITLE }}
            helperText={`${jpTitle.length}/${MAX_TITLE}`}
            fullWidth
          />
          <TextField
            label="JP 본문"
            required
            multiline
            minRows={3}
            value={jpBody}
            onChange={(e) => setJpBody(e.target.value)}
            inputProps={{ maxLength: MAX_BODY }}
            helperText={`${jpBody.length}/${MAX_BODY}`}
            fullWidth
          />
          <TextField
            label="딥링크"
            placeholder="sometimes://home"
            value={deepLink}
            onChange={(e) => setDeepLink(e.target.value)}
            fullWidth
          />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          발송 예정 시각
        </Typography>
        <TextField
          type="datetime-local"
          label="발송 예정 시각 (KST)"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 320 }}
        />
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
          테스트 발송 (필수)
        </Typography>
        <Alert severity="info" sx={{ mb: 2 }}>
          예약 등록 전 반드시 테스트 발송으로 문구를 확인해야 합니다.
        </Alert>
        <TextField
          label="테스트 수신 관리자 userId"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          sx={{ mb: 2, width: 320 }}
        />
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => handleTestSend('kr')}
            disabled={testSendingCountry === 'kr'}
          >
            {testSendingCountry === 'kr' ? <CircularProgress size={18} /> : 'KR 문구 테스트 발송'}
          </Button>
          <Button
            variant="outlined"
            onClick={() => handleTestSend('jp')}
            disabled={testSendingCountry === 'jp'}
          >
            {testSendingCountry === 'jp' ? <CircularProgress size={18} /> : 'JP 문구 테스트 발송'}
          </Button>
        </Stack>
        <FormControlLabel
          control={
            <Checkbox
              checked={testConfirmed}
              onChange={(e) => setTestConfirmed(e.target.checked)}
            />
          }
          label="테스트 푸시를 수신했음을 확인했습니다."
        />
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          color="error"
          size="large"
          disabled={!canSubmit}
          onClick={handleOpenConfirm}
        >
          예약 등록
        </Button>
      </Box>

      <Dialog
        open={confirmOpen}
        onClose={() => !submitting && setConfirmOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>예약 발송 최종 확인</DialogTitle>
        <DialogContent>
          <Alert severity="warning" icon={<WarningAmberIcon />} sx={{ mb: 2 }}>
            주의: 예약 등록 후에는 취소할 수 없습니다. 등록 즉시 예약이 확정됩니다.
          </Alert>
          <Stack spacing={1.5}>
            <SummaryRow label="발송 대상" value={targetSummary} />
            <SummaryRow label="예정 시각" value={formatDateTimeKR(scheduledAt)} />
            <SummaryRow label="KR 제목" value={krTitle} />
            <SummaryRow label="JP 제목" value={jpTitle} />
            <SummaryRow label="딥링크" value={deepLink || '-'} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={submitting}>
            취소
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmSubmit}
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={18} /> : '예약 등록 진행'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(result)} maxWidth="xs" fullWidth>
        <DialogTitle>예약 등록 완료</DialogTitle>
        <DialogContent>
          <Stack spacing={1}>
            <Typography variant="body2">예약 ID: {result?.id}</Typography>
            <Typography variant="body2">
              예상 대상 인원: {result?.targetPreviewCount.toLocaleString()}명
            </Typography>
            <Typography variant="body2">
              발송 예정 시각: {result ? formatDateTimeKR(result.scheduledAt) : '-'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => router.push('/admin/broadcast-push')}>
            이력 보기
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      <Typography variant="body2" color="text.secondary" sx={{ width: 100, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Box>
  );
}
