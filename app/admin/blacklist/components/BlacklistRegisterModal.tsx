'use client';

import React, { useState } from 'react';
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
import { blacklist } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

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
  onSuccess?: () => void;
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

export function BlacklistRegisterModal({ open, onClose, user, onSuccess }: Props) {
  const [reason, setReason] = useState('');
  const [memo, setMemo] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    setMemo('');
    setConfirmed(false);
    setError(null);
    onClose();
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

  const handleSubmit = async () => {
    if (submitDisabled) return;
    setSubmitting(true);
    setError(null);
    try {
      await blacklist.register(user.id, {
        reason: reason.trim(),
        memo: memo.trim() ? memo.trim() : undefined,
      });
      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(getAdminErrorMessage(err, '블랙리스트 등록 실패'));
    } finally {
      setSubmitting(false);
    }
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
          severity="warning"
          icon={<AlertTriangle size={18} />}
          sx={{ mb: 2 }}
        >
          <Typography variant="body2" fontWeight={600} mb={0.5}>
            블랙리스트 등록 시 즉시 적용되는 동작
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            <li>세션 강제 만료 (현재 로그인 끊김)</li>
            <li>푸시/SMS 발송 중단</li>
            <li>매칭 후보 풀에서 제외</li>
            <li>재로그인 차단</li>
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
          helperText={
            <span style={{ color: reasonOver ? '#dc2626' : undefined }}>
              {reason.length}/{REASON_MAX}
            </span>
          }
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
          helperText={
            <span style={{ color: memoOver ? '#dc2626' : undefined }}>
              {memo.length}/{MEMO_MAX}
            </span>
          }
        />

        <FormControlLabel
          sx={{ mt: 1 }}
          control={
            <Checkbox
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
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
