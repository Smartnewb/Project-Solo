'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Chip,
  Alert,
  Checkbox,
  FormControlLabel,
  Stack,
} from '@mui/material';
import { ShieldBan, AlertTriangle } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { blacklist } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const WARNING_ID = 'blacklist-register-warning';
const NOTICE_WARNING_ID = 'blacklist-notice-warning';

interface Props {
  open: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    phoneNumber?: string;
    age?: number;
    gender?: string;
    universityName?: string;
  };
  initialReason?: string;
  initialMemo?: string;
  onSuccess?: (message?: string) => void;
}

const QUICK_REASONS = [
  '욕설/혐오',
  '스팸',
  '사칭',
  '미성년',
  '신고누적',
  '결제어뷰징',
];

const REASON_MAX = 500;
const MEMO_MAX = 2000;

export function BlacklistRegisterModal({
  open,
  onClose,
  user,
  initialReason = '',
  initialMemo = '',
  onSuccess,
}: Props) {
  const [reason, setReason] = useState(initialReason);
  const [memo, setMemo] = useState(initialMemo);
  const [confirmed, setConfirmed] = useState(false);
  const [sendNotice, setSendNotice] = useState(true);

  useEffect(() => {
    if (!open) return;
    setReason(initialReason);
    setMemo(initialMemo);
    setConfirmed(false);
    setSendNotice(true);
  }, [open, initialReason, initialMemo, user.id]);

  const mutation = useMutation({
    mutationFn: () =>
      blacklist.register(user.id, {
        reason: reason.trim(),
        memo: memo.trim() ? memo.trim() : undefined,
        sendNotice,
      }),
    onSuccess: () => {
      const message = sendNotice
        ? '제재 완료. 유저 고지 발송을 요청했습니다.'
        : '제재 완료. 운영자 선택으로 고지는 보내지 않았습니다.';
      onSuccess?.(message);
      resetAndClose();
    },
  });
  const submitting = mutation.isPending;
  const error = mutation.isError
    ? getAdminErrorMessage(mutation.error, '블랙리스트 등록 실패')
    : null;

  const resetAndClose = () => {
    setReason(initialReason);
    setMemo(initialMemo);
    setConfirmed(false);
    setSendNotice(true);
    mutation.reset();
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const appendQuickReason = (label: string) => {
    setReason((prev) => {
      if (!prev.trim()) return label;
      if (prev.includes(label)) return prev;
      return `${prev} · ${label}`;
    });
  };

  const reasonOver = reason.length > REASON_MAX;
  const memoOver = memo.length > MEMO_MAX;
  const submitDisabled =
    submitting ||
    !confirmed ||
    reason.trim().length === 0 ||
    reasonOver ||
    memoOver;

  const handleSubmit = () => {
    if (submitDisabled) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <ShieldBan size={20} color="#dc2626" />
        블랙리스트 등록
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            대상 유저
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {user.name}
            {user.age ? ` · ${user.age}세` : ''}
            {user.gender ? ` · ${user.gender}` : ''}
          </Typography>
          {user.phoneNumber && (
            <Typography variant="body2" color="text.secondary">
              {user.phoneNumber}
            </Typography>
          )}
          {user.universityName && (
            <Typography variant="body2" color="text.secondary">
              {user.universityName}
            </Typography>
          )}
        </Box>

        <Alert
          id={NOTICE_WARNING_ID}
          severity="warning"
          icon={<AlertTriangle size={18} />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={700} mb={0.5}>
            유저 고지 발송 안내
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            기본으로 인앱 알림 + SMS 고지가 발송됩니다.
          </Typography>
          <Typography variant="body2" sx={{ mb: 0.5 }}>
            문구에 정지/이용제한 사유와 7일 이내 소명 안내가 포함됩니다.
          </Typography>
          <Typography variant="body2">
            직접 발송 번호/이메일 안내는 백엔드 템플릿 기준입니다.
          </Typography>
        </Alert>

        <Alert
          id={WARNING_ID}
          severity="error"
          icon={<AlertTriangle size={18} />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={600} mb={0.5}>
            블랙리스트 · 영구 차단 성격 + 기본 고지
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            <li>세션 강제 만료 (현재 로그인 끊김)</li>
            <li>재로그인 차단 / 매칭 후보 풀 제외</li>
            <li>영구 차단 성격 (해제 전까지 유지)</li>
            <li>기본값으로 약관 고지(인앱 알림+SMS) 발송</li>
          </Box>
        </Alert>

        <Box mb={1}>
          <Typography variant="subtitle2" gutterBottom>
            빠른 사유
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {QUICK_REASONS.map((label) => (
              <Chip
                key={label}
                label={label}
                size="small"
                onClick={() => appendQuickReason(label)}
                clickable
              />
            ))}
          </Stack>
        </Box>

        <TextField
          label="사유 (필수)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          required
          margin="normal"
          error={reasonOver}
          helperText={`${reason.length}/${REASON_MAX}`}
        />

        <TextField
          label="메모 (선택)"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={6}
          margin="normal"
          error={memoOver}
          helperText={`${memo.length}/${MEMO_MAX}`}
        />

        <FormControlLabel
          sx={{ mt: 1, display: 'flex', alignItems: 'flex-start' }}
          control={
            <Checkbox
              checked={sendNotice}
              onChange={(e) => setSendNotice(e.target.checked)}
              disabled={submitting}
              sx={{ pt: 0.25 }}
              inputProps={{ 'aria-describedby': NOTICE_WARNING_ID }}
            />
          }
          label="유저에게 고지(알림+문자) 보내기"
        />

        {!sendNotice && (
          <Alert severity="error" sx={{ mt: 1 }}>
            고지 없이 제재합니다. 약관 고지 누락 위험이 있으니 특별한 경우에만
            사용하세요.
          </Alert>
        )}

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              inputProps={{ 'aria-describedby': WARNING_ID }}
            />
          }
          label="이 유저를 블랙리스트 등록합니다. 확인했습니다."
        />

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={submitting}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="error"
          disabled={submitDisabled}
          startIcon={<ShieldBan size={16} />}
        >
          {submitting ? '등록 중...' : '블랙리스트 등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BlacklistRegisterModal;
