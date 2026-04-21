'use client';

import { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField, Typography } from '@mui/material';
import { usePushResendNotice } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';

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

  if (!open || !item) return null;

  const handleSubmit = async () => {
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
      const error = err as { message?: string };
      toast.error(error.message || '재발송에 실패했습니다.');
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 1300,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <Paper sx={{ p: 3, maxWidth: 480, width: '100%', mx: 2 }} onClick={(e) => e.stopPropagation()}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          푸시 재발송
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          &quot;{item.title}&quot; 공지의 푸시 알림을 다시 발송합니다.
        </Typography>
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
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
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
        </Box>
      </Paper>
    </Box>
  );
}
