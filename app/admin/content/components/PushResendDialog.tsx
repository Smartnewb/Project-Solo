'use client';

import { useEffect, useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
} from '@mui/material';
import { usePushResendNotice } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';

interface Props {
  open: boolean;
  onClose: () => void;
  item: {
    id: string;
    title: string;
    pushTitle?: string | null;
    pushMessage?: string | null;
  } | null;
}

export function PushResendDialog({ open, onClose, item }: Props) {
  const toast = useToast();
  const mutation = usePushResendNotice();
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');

  useEffect(() => {
    if (item) {
      setPushTitle(item.pushTitle || '');
      setPushMessage(item.pushMessage || '');
    }
  }, [item]);

  const handleSubmit = async () => {
    if (!item) return;
    if (!pushTitle.trim() || !pushMessage.trim()) {
      toast.error('푸시 제목과 메시지는 필수입니다.');
      return;
    }
    try {
      const res = await mutation.mutateAsync({
        id: item.id,
        data: { pushTitle: pushTitle.trim(), pushMessage: pushMessage.trim() },
      });
      toast.success(`푸시 재발송 완료. ${res.sentCount ?? 0}명에게 전송.`);
      onClose();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '재발송에 실패했습니다.'));
    }
  };

  return (
    <Dialog open={open && !!item} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>푸시 재발송</DialogTitle>
      <DialogContent>
        {item && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            &quot;{item.title}&quot; 공지의 푸시 알림을 다시 발송합니다.
          </Typography>
        )}
        <TextField
          fullWidth
          label="푸시 제목"
          value={pushTitle}
          onChange={(e) => setPushTitle(e.target.value)}
          inputProps={{ maxLength: 50 }}
          helperText={`${pushTitle.length}/50자`}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="푸시 메시지"
          value={pushMessage}
          onChange={(e) => setPushMessage(e.target.value)}
          inputProps={{ maxLength: 100 }}
          helperText={`${pushMessage.length}/100자`}
          multiline
          rows={2}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={mutation.isPending}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={mutation.isPending || !pushTitle.trim() || !pushMessage.trim()}
        >
          {mutation.isPending ? '발송 중...' : '재발송'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
