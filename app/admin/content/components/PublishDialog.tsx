'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import {
  usePublishCardNews,
  useUpdateSometimeArticle,
  usePublishNotice,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';

export type PublishDialogType = 'card-series' | 'article' | 'notice';

interface Props {
  open: boolean;
  onClose: () => void;
  type: PublishDialogType;
  item: { id: string; title: string } | null;
  onPublished?: () => void;
}

export function PublishDialog({ open, onClose, type, item, onPublished }: Props) {
  const toast = useToast();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');

  const publishCardNews = usePublishCardNews();
  const updateArticle = useUpdateSometimeArticle();
  const publishNotice = usePublishNotice();

  useEffect(() => {
    if (open) {
      setPushEnabled(true);
      setPushTitle('');
      setPushMessage('');
    }
  }, [open, item?.id]);

  if (!open || !item) return null;

  const isPending =
    publishCardNews.isPending || updateArticle.isPending || publishNotice.isPending;

  const validate = () => {
    if (!pushEnabled) return true;
    if (!pushMessage.trim()) {
      toast.error('푸시 알림 메시지를 입력해주세요.');
      return false;
    }
    return true;
  };

  const handleConfirm = async () => {
    if (!validate()) return;

    try {
      if (type === 'card-series') {
        const result = await publishCardNews.mutateAsync({
          id: item.id,
          data: {
            ...(pushEnabled && pushTitle.trim()
              ? { pushNotificationTitle: pushTitle.trim() }
              : {}),
            ...(pushEnabled && pushMessage.trim()
              ? { pushNotificationMessage: pushMessage.trim() }
              : {}),
          },
        });
        if (result.success) {
          toast.success(
            pushEnabled
              ? `푸시 알림이 ${result.sentCount ?? 0}명에게 발송되었습니다.`
              : '카드시리즈가 발행되었습니다.',
          );
        } else {
          toast.error('발행에 실패했습니다. 다시 시도해주세요.');
          return;
        }
      } else if (type === 'article') {
        await updateArticle.mutateAsync({
          id: item.id,
          data: {
            status: 'published',
            publishedAt: new Date().toISOString(),
          },
        });
        toast.success('아티클이 발행되었습니다.');
      } else if (type === 'notice') {
        const result = await publishNotice.mutateAsync({
          id: item.id,
          data: {
            pushEnabled,
            ...(pushEnabled && pushTitle.trim() ? { pushTitle: pushTitle.trim() } : {}),
            ...(pushEnabled && pushMessage.trim() ? { pushMessage: pushMessage.trim() } : {}),
          },
        });
        if (result.success) {
          toast.success(
            pushEnabled
              ? `공지가 발행되고 ${result.sentCount ?? 0}명에게 푸시 발송되었습니다.`
              : '공지가 발행되었습니다.',
          );
        } else {
          toast.error('발행에 실패했습니다.');
          return;
        }
      }

      onPublished?.();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string };
      toast.error(error.response?.data?.message || error.message || '발행에 실패했습니다.');
    }
  };

  const typeLabel =
    type === 'card-series' ? '카드시리즈' : type === 'article' ? '아티클' : '공지';

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
      <Paper
        sx={{ p: 3, maxWidth: 480, width: '100%', mx: 2 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" sx={{ mb: 2 }}>
          {typeLabel} 발행
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          이 {typeLabel}을(를) 발행하시겠습니까?
        </Typography>
        <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>제목:</strong> {item.title}
          </Typography>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
            />
          }
          label="푸시 알림 함께 발송"
          sx={{ mb: 1 }}
        />

        {pushEnabled && (
          <>
            <TextField
              fullWidth
              size="small"
              label="푸시 알림 제목 (선택)"
              value={pushTitle}
              onChange={(e) => setPushTitle(e.target.value)}
              inputProps={{ maxLength: 50 }}
              helperText={`${pushTitle.length}/50자 | 비워두면 콘텐츠 제목이 사용됩니다.`}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              size="small"
              label="푸시 알림 메시지"
              value={pushMessage}
              onChange={(e) => setPushMessage(e.target.value)}
              inputProps={{ maxLength: 100 }}
              helperText={`${pushMessage.length}/100자 | 필수 항목입니다.`}
              multiline
              rows={2}
              error={!pushMessage.trim()}
            />
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 3 }}>
          <Button onClick={onClose} disabled={isPending}>
            취소
          </Button>
          <Button
            onClick={handleConfirm}
            color="primary"
            variant="contained"
            disabled={isPending || (pushEnabled && !pushMessage.trim())}
          >
            {isPending ? '발행 중...' : '발행'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
