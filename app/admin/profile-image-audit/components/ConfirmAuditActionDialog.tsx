'use client';

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { ACTION_LABELS, SIMPLE_REJECT_REASON } from '../constants';
import { getActionTone } from '../profile-image-audit-utils';
import type { AuditAction } from '../types';

type Props = {
  readonly action: AuditAction | null;
  readonly selectedCount: number;
  readonly busy: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
};

export function ConfirmAuditActionDialog({
  action,
  selectedCount,
  busy,
  onClose,
  onConfirm,
}: Props) {
  const open = action != null;
  const tone = action ? getActionTone(action) : 'primary';

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{action ? ACTION_LABELS[action] : '처리 확인'}</DialogTitle>
      <DialogContent dividers>
        <Typography>
          선택한 프로필 이미지 {selectedCount.toLocaleString()}장을 처리합니다.
        </Typography>
        {action === 'reject' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            거절 사유는 “{SIMPLE_REJECT_REASON}”로 일괄 기록됩니다.
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
        <Button onClick={onConfirm} disabled={busy} color={tone} variant="contained">
          처리
        </Button>
      </DialogActions>
    </Dialog>
  );
}
