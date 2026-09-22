'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ACTION_LABELS, REJECT_REASON_OPTIONS, SIMPLE_REJECT_REASON } from '../constants';
import { getActionTone } from '../profile-image-audit-utils';
import type { AuditAction } from '../types';

const CUSTOM_REJECT_REASON_VALUE = '__custom__';

type Props = {
  readonly action: AuditAction | null;
  readonly selectedCount: number;
  readonly busy: boolean;
  readonly removesLastApprovedImage?: boolean;
  readonly onClose: () => void;
  readonly onConfirm: (rejectReason?: string) => void;
};

export function ConfirmAuditActionDialog({
  action,
  selectedCount,
  removesLastApprovedImage = false,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const open = action != null;
  const tone = action ? getActionTone(action) : 'primary';
  const [selectedRejectReason, setSelectedRejectReason] = useState(SIMPLE_REJECT_REASON);
  const [rejectReason, setRejectReason] = useState(SIMPLE_REJECT_REASON);
  const normalizedRejectReason = rejectReason.trim();

  useEffect(() => {
    if (action === 'reject') {
      setSelectedRejectReason(SIMPLE_REJECT_REASON);
      setRejectReason(SIMPLE_REJECT_REASON);
    }
  }, [action]);

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{action ? ACTION_LABELS[action] : '처리 확인'}</DialogTitle>
      <DialogContent dividers>
        <Typography>
          선택한 프로필 이미지 {selectedCount.toLocaleString()}장을 처리합니다.
        </Typography>
        {action === 'reject' && (
          <Stack spacing={2} mt={2}>
            <FormControl fullWidth size="small">
              <InputLabel id="profile-image-reject-reason-label">사진 변경 요청 사유</InputLabel>
              <Select
                labelId="profile-image-reject-reason-label"
                label="사진 변경 요청 사유"
                value={selectedRejectReason}
                onChange={(event) => {
                  const nextReason = event.target.value;
                  setSelectedRejectReason(nextReason);
                  if (nextReason !== CUSTOM_REJECT_REASON_VALUE) {
                    setRejectReason(nextReason);
                  }
                }}
              >
                {REJECT_REASON_OPTIONS.map((reason) => (
                  <MenuItem key={reason} value={reason}>
                    {reason}
                  </MenuItem>
                ))}
                <MenuItem value={CUSTOM_REJECT_REASON_VALUE}>직접 작성</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="직접 작성"
              value={rejectReason}
              onChange={(event) => {
                setSelectedRejectReason(CUSTOM_REJECT_REASON_VALUE);
                setRejectReason(event.target.value);
              }}
              multiline
              minRows={3}
              fullWidth
              inputProps={{ maxLength: 255 }}
              helperText={`${normalizedRejectReason.length}/255`}
              error={normalizedRejectReason.length === 0}
            />
            <Alert severity="info">
              선택한 사진의 승인을 취소하고 앱 푸시로 변경을 요청합니다. 문자(SMS)는 발송하지 않습니다.
            </Alert>
          </Stack>
        )}
        {(action === 'delete' || action === 'reject') && removesLastApprovedImage && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            승인된 사진이 모두 없어지는 회원이 있습니다. 처리하면 사진 재업로드가 필요합니다.
          </Alert>
        )}
        {action === 'delete' && (
          <Alert severity="error" sx={{ mt: 2 }}>
            삭제는 되돌리기 어려운 조치입니다. 명백히 부적절한 이미지만 선택하세요.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          취소
        </Button>
        <Button
          onClick={() => onConfirm(action === 'reject' ? normalizedRejectReason : undefined)}
          disabled={busy || (action === 'reject' && normalizedRejectReason.length === 0)}
          color={tone}
          variant="contained"
        >
          처리
        </Button>
      </DialogActions>
    </Dialog>
  );
}
