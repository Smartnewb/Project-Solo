'use client';

import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Divider,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useRouter } from 'next/navigation';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAdminForm } from '@/app/admin/hooks/forms';
import {
  noticeFormSchema,
  type NoticeFormData,
} from '@/app/admin/hooks/forms/schemas/content.schema';
import {
  useCreateNotice,
  useUpdateNotice,
  useNoticeDetail,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import type { CreateNoticeRequest, UpdateNoticeRequest } from '@/types/admin';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

export function NoticeForm({ mode, id }: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const isEdit = mode === 'edit';

  const {
    control,
    watch,
    reset,
    handleFormSubmit,
    formState: { isSubmitting },
  } = useAdminForm<NoticeFormData>({
    schema: noticeFormSchema,
    defaultValues: {
      title: '',
      subtitle: '',
      categoryCode: 'notice',
      content: '',
      priority: 'normal',
      expiresAt: null,
      url: '',
      hasReward: false,
      pushEnabled: false,
      pushTitle: '',
      pushMessage: '',
    },
  });

  const pushEnabled = watch('pushEnabled');

  const createMutation = useCreateNotice();
  const updateMutation = useUpdateNotice();
  const { data: detail, isLoading: detailLoading } = useNoticeDetail(isEdit ? id || '' : '');

  useEffect(() => {
    if (isEdit && detail) {
      reset({
        title: detail.title,
        subtitle: detail.subtitle || '',
        categoryCode: 'notice',
        content: detail.content,
        priority: detail.priority,
        expiresAt: detail.expiresAt || null,
        url: detail.url || '',
        hasReward: detail.hasReward,
        pushEnabled: detail.pushEnabled,
        pushTitle: detail.pushTitle || '',
        pushMessage: detail.pushMessage || '',
      });
    }
  }, [isEdit, detail, reset]);

  const handleCancel = async () => {
    const ok = await confirmAction({
      title: '작성 취소',
      message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
    });
    if (ok) {
      router.push('/admin/content?tab=notice');
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    try {
      if (isEdit && id) {
        const payload: UpdateNoticeRequest = {
          title: data.title.trim(),
          subtitle: data.subtitle?.trim() || undefined,
          content: data.content,
          priority: data.priority,
          expiresAt: data.expiresAt || null,
          url: data.url?.trim() || null,
          hasReward: data.hasReward,
          pushEnabled: data.pushEnabled,
          pushTitle: data.pushEnabled ? data.pushTitle?.trim() || null : null,
          pushMessage: data.pushEnabled ? data.pushMessage?.trim() || null : null,
        };
        await updateMutation.mutateAsync({ id, data: payload });
        toast.success('공지가 수정되었습니다.');
      } else {
        const payload: CreateNoticeRequest = {
          title: data.title.trim(),
          subtitle: data.subtitle?.trim() || undefined,
          categoryCode: 'notice',
          content: data.content,
          priority: data.priority,
          expiresAt: data.expiresAt || null,
          url: data.url?.trim() || null,
          hasReward: data.hasReward,
          pushEnabled: data.pushEnabled,
          pushTitle: data.pushEnabled ? data.pushTitle?.trim() || null : null,
          pushMessage: data.pushEnabled ? data.pushMessage?.trim() || null : null,
        };
        await createMutation.mutateAsync(payload);
        toast.success('공지가 생성되었습니다.');
      }
      router.push('/admin/content?tab=notice');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
    }
  });

  if (isEdit && detailLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
            목록으로
          </Button>
          <Typography variant="h5" fontWeight="bold">
            {isEdit ? '공지 수정' : '새 공지 작성'}
          </Typography>
        </Box>

        {createMutation.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            저장에 실패했습니다. 다시 시도해주세요.
          </Alert>
        )}

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            기본 정보
          </Typography>

          <Controller
            name="title"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="제목"
                {...field}
                inputProps={{ maxLength: 50 }}
                helperText={fieldState.error?.message ?? `${field.value.length}/50자`}
                error={!!fieldState.error}
                sx={{ mb: 2 }}
                required
              />
            )}
          />

          <Controller
            name="subtitle"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="부제목"
                {...field}
                value={field.value ?? ''}
                inputProps={{ maxLength: 100 }}
                helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/100자`}
                error={!!fieldState.error}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="content"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="본문"
                {...field}
                multiline
                rows={8}
                inputProps={{ maxLength: 2000 }}
                helperText={fieldState.error?.message ?? '공지 본문을 입력해주세요 (HTML 또는 텍스트)'}
                error={!!fieldState.error}
                required
              />
            )}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            게시 설정
          </Typography>

          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            우선순위
          </Typography>
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <RadioGroup row {...field} sx={{ mb: 2 }}>
                <FormControlLabel value="normal" control={<Radio />} label="일반" />
                <FormControlLabel value="high" control={<Radio />} label="긴급" />
              </RadioGroup>
            )}
          />

          <Controller
            name="expiresAt"
            control={control}
            render={({ field, fieldState }) => (
              <DateTimePicker
                label="만료 일시 (선택)"
                value={field.value ? new Date(field.value) : null}
                onChange={(date) =>
                  field.onChange(date ? date.toISOString() : null)
                }
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mb: 2 },
                    helperText: fieldState.error?.message,
                    error: !!fieldState.error,
                  },
                }}
              />
            )}
          />

          <Controller
            name="url"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="외부 링크 (선택)"
                {...field}
                value={field.value ?? ''}
                placeholder="https://..."
                helperText={fieldState.error?.message ?? '유저 앱에서 배너 클릭 시 이동할 URL'}
                error={!!fieldState.error}
              />
            )}
          />
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            푸시 알림
          </Typography>

          <Controller
            name="pushEnabled"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                }
                label="푸시 알림 발송"
              />
            )}
          />

          {pushEnabled && (
            <>
              <Divider sx={{ my: 2 }} />
              <Controller
                name="pushTitle"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    fullWidth
                    label="푸시 제목"
                    {...field}
                    value={field.value ?? ''}
                    inputProps={{ maxLength: 50 }}
                    helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/50자`}
                    error={!!fieldState.error}
                    sx={{ mb: 2 }}
                    required
                  />
                )}
              />
              <Controller
                name="pushMessage"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    fullWidth
                    label="푸시 메시지"
                    {...field}
                    value={field.value ?? ''}
                    inputProps={{ maxLength: 100 }}
                    helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/100자`}
                    error={!!fieldState.error}
                    multiline
                    rows={2}
                    required
                  />
                )}
              />
            </>
          )}
        </Paper>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            보상
          </Typography>
          <Controller
            name="hasReward"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={
                  <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                }
                label="리워드 지급"
              />
            )}
          />
        </Paper>

        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
          <Button variant="outlined" onClick={handleCancel} disabled={isSubmitting}>
            취소
          </Button>
          <Button
            variant="contained"
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '저장 중...' : '저장'}
          </Button>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
