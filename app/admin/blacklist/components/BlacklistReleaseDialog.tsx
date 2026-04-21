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
  Alert,
} from '@mui/material';
import { RotateCcw } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { blacklist } from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  currentReason?: string | null;
  blacklistedAt?: string | null;
  onSuccess?: () => void;
}

const RELEASE_REASON_MAX = 500;

export function BlacklistReleaseDialog({
  open,
  onClose,
  userId,
  userName,
  currentReason,
  blacklistedAt,
  onSuccess,
}: Props) {
  const [releaseReason, setReleaseReason] = useState('');

  const mutation = useMutation({
    mutationFn: () => {
      const trimmed = releaseReason.trim();
      return blacklist.release(userId, trimmed ? { releaseReason: trimmed } : undefined);
    },
    onSuccess: () => {
      onSuccess?.();
      resetAndClose();
    },
  });
  const submitting = mutation.isPending;
  const error = mutation.isError
    ? getAdminErrorMessage(mutation.error, '블랙리스트 해제 실패')
    : null;

  const resetAndClose = () => {
    setReleaseReason('');
    mutation.reset();
    onClose();
  };

  const handleClose = () => {
    if (submitting) return;
    resetAndClose();
  };

  const releaseReasonOver = releaseReason.length > RELEASE_REASON_MAX;
  const submitDisabled = submitting || releaseReasonOver;

  const handleSubmit = () => {
    if (submitDisabled) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <RotateCcw size={20} />
        블랙리스트 해제
      </DialogTitle>
      <DialogContent dividers>
        <Box mb={2}>
          <Typography variant="subtitle2" color="text.secondary">
            대상 유저
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {userName}
          </Typography>
        </Box>

        {currentReason && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              등록 사유
            </Typography>
            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
              {currentReason}
            </Typography>
          </Box>
        )}

        {blacklistedAt && (
          <Box mb={2}>
            <Typography variant="subtitle2" color="text.secondary">
              등록일
            </Typography>
            <Typography variant="body2">
              {formatDateTimeWithoutTimezoneConversion(blacklistedAt)}
            </Typography>
          </Box>
        )}

        <Alert severity="info" sx={{ mb: 2 }}>
          해제 시 유저는 재로그인·서비스 이용이 가능합니다. 푸시 재활성은 앱 재실행 시 복원됩니다.
        </Alert>

        <TextField
          label="해제 사유 (선택)"
          value={releaseReason}
          onChange={(e) => setReleaseReason(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          maxRows={4}
          margin="normal"
          error={releaseReasonOver}
          helperText={`${releaseReason.length}/${RELEASE_REASON_MAX}`}
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
          color="primary"
          disabled={submitDisabled}
          startIcon={<RotateCcw size={16} />}
        >
          {submitting ? '해제 중...' : '블랙리스트 해제'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BlacklistReleaseDialog;
