'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import {
  RESOLUTION_REASON_LABELS,
  type SupportResolutionReason,
} from '@/app/types/support-chat';

const RESOLUTION_REASONS: SupportResolutionReason[] = [
  'solved',
  'duplicate',
  'spam',
  'transferred',
  'simple_inquiry',
  'other',
];

const CLOSING_PRESETS: { label: string; message: string }[] = [
  { label: '기본 인사', message: '문의해 주셔서 감사합니다. 좋은 하루 되세요!' },
  {
    label: '해결 확인',
    message: '문의주신 내용은 해결된 것으로 확인됩니다. 추가로 불편한 점이 있으면 언제든 다시 문의해 주세요. 감사합니다!',
  },
  {
    label: '추가 안내',
    message: '안내드린 내용으로 도움이 되었길 바랍니다. 더 궁금한 점이 생기면 새 문의로 남겨주세요. 감사합니다!',
  },
];

interface ResolveDialogProps {
  open: boolean;
  loading: boolean;
  nickname?: string;
  onClose: () => void;
  /** sendClosingMessage 가 false면 종료 메시지 없이 세션만 종료 */
  onConfirm: (params: {
    closingMessage?: string;
    resolutionReason?: SupportResolutionReason;
  }) => void;
}

export default function ResolveDialog({
  open,
  loading,
  nickname,
  onClose,
  onConfirm,
}: ResolveDialogProps) {
  const [sendClosingMessage, setSendClosingMessage] = useState(true);
  const [message, setMessage] = useState(CLOSING_PRESETS[0].message);
  const [reason, setReason] = useState<SupportResolutionReason>('solved');

  useEffect(() => {
    if (open) {
      setSendClosingMessage(true);
      setMessage(CLOSING_PRESETS[0].message);
      setReason('solved');
    }
  }, [open]);

  const handleConfirm = () => {
    const trimmed = message.trim();
    if (sendClosingMessage && !trimmed) return;
    onConfirm({
      closingMessage: sendClosingMessage ? trimmed : undefined,
      resolutionReason: reason,
    });
  };

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      <DialogTitle>문의 해결 완료</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          {nickname ? `${nickname}님의 ` : ''}문의를 해결 완료로 처리합니다.
          종료 메시지를 함께 전송할 수 있습니다.
        </DialogContentText>

        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
          해결 사유
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {RESOLUTION_REASONS.map((r) => (
            <Chip
              key={r}
              label={RESOLUTION_REASON_LABELS[r]}
              size="small"
              variant={reason === r ? 'filled' : 'outlined'}
              color={reason === r ? 'primary' : 'default'}
              onClick={() => setReason(r)}
              disabled={loading}
            />
          ))}
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={sendClosingMessage}
              onChange={(e) => setSendClosingMessage(e.target.checked)}
              disabled={loading}
            />
          }
          label="종료 메시지 전송"
          sx={{ mb: 1 }}
        />

        {sendClosingMessage && (
          <>
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1.5 }}>
              {CLOSING_PRESETS.map((preset) => (
                <Chip
                  key={preset.label}
                  label={preset.label}
                  size="small"
                  variant={message === preset.message ? 'filled' : 'outlined'}
                  color={message === preset.message ? 'primary' : 'default'}
                  onClick={() => setMessage(preset.message)}
                  disabled={loading}
                />
              ))}
            </Box>
            <TextField
              fullWidth
              multiline
              minRows={3}
              label="종료 메시지"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputProps={{ maxLength: 1000 }}
              helperText={`${message.length}/1000자`}
              disabled={loading}
            />
          </>
        )}

        {!sendClosingMessage && (
          <Typography variant="caption" color="text.secondary">
            메시지 없이 세션만 해결 완료로 전환됩니다.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          취소
        </Button>
        <Button
          variant="contained"
          color="success"
          onClick={handleConfirm}
          disabled={loading || (sendClosingMessage && !message.trim())}
          startIcon={loading ? <CircularProgress size={16} /> : <CheckCircleIcon />}
        >
          해결 완료
        </Button>
      </DialogActions>
    </Dialog>
  );
}
