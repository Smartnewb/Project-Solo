'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
  Alert,
} from '@mui/material';
import { Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import BackgroundSelector from '../card-series/BackgroundSelector';
import LongformPreview from '../card-series/LongformPreview';
import MarkdownEditor from '../article/MarkdownEditor';
import PresetUploadModal from '../card-series/PresetUploadModal';
import PresetEditModal from '../card-series/PresetEditModal';
import type { BackgroundPreset, CreateCardNewsRequest } from '@/types/admin';
import SaveIcon from '@mui/icons-material/Save';
import SendIcon from '@mui/icons-material/Send';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAdminForm } from '@/app/admin/hooks/forms';
import {
  longformFormSchema,
  type LongformFormData,
  estimateReadTimeMinutes,
  LONGFORM_BODY_SOFT_LIMIT_BYTES,
} from '@/app/admin/hooks/forms/schemas/longform.schema';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { NEW_CATEGORY_OPTIONS } from '../../constants';

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

export function LongformForm({ mode, id }: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const isEdit = mode === 'edit';

  const {
    control,
    watch,
    reset,
    handleFormSubmit,
    getValues,
    formState: { isSubmitting, isDirty },
  } = useAdminForm<LongformFormData>({
    schema: longformFormSchema,
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      categoryCode: '',
      hasReward: false,
      body: '',
      pushTitle: '',
      pushMessage: '',
    },
  });

  const watchedTitle = watch('title');
  const watchedSubtitle = watch('subtitle');
  const watchedDescription = watch('description');
  const watchedCategoryCode = watch('categoryCode');
  const watchedBody = watch('body');

  const [backgroundType, setBackgroundType] = useState<'PRESET' | 'CUSTOM'>('PRESET');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
  const [backgroundPresets, setBackgroundPresets] = useState<BackgroundPreset[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [presetUploadModalOpen, setPresetUploadModalOpen] = useState(false);
  const [presetEditModalOpen, setPresetEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<BackgroundPreset | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [extraCategoryOption, setExtraCategoryOption] = useState<{
    code: string;
    label: string;
  } | null>(null);
  const [warnedSoftLimit, setWarnedSoftLimit] = useState(false);

  const previewBackgroundUrl = useMemo(() => {
    if (backgroundType === 'CUSTOM' && customBackgroundUrl) return customBackgroundUrl;
    if (backgroundType === 'PRESET' && selectedPresetId) {
      const preset = backgroundPresets.find((p) => p.id === selectedPresetId);
      return preset?.imageUrl || preset?.thumbnailUrl;
    }
    return undefined;
  }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);

  const readTimeMinutes = useMemo(
    () => estimateReadTimeMinutes(watchedBody ?? ''),
    [watchedBody],
  );

  const categoryOptions = useMemo(() => {
    const base = NEW_CATEGORY_OPTIONS.map((c) => ({ code: c.code, label: c.label }));
    if (extraCategoryOption && !base.find((b) => b.code === extraCategoryOption.code)) {
      return [...base, extraCategoryOption];
    }
    return base;
  }, [extraCategoryOption]);

  const categoryLabel = useMemo(() => {
    const found = categoryOptions.find((c) => c.code === watchedCategoryCode);
    return found?.label ?? '';
  }, [categoryOptions, watchedCategoryCode]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty, isSubmitting]);

  useEffect(() => {
    const bodyBytes = new Blob([watchedBody ?? '']).size;
    if (bodyBytes > LONGFORM_BODY_SOFT_LIMIT_BYTES && !warnedSoftLimit) {
      toast.warning('본문이 50KB를 초과합니다. 분량이 과도하게 길지 않은지 확인해주세요.');
      setWarnedSoftLimit(true);
    } else if (bodyBytes <= LONGFORM_BODY_SOFT_LIMIT_BYTES && warnedSoftLimit) {
      setWarnedSoftLimit(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedBody]);

  const fetchBackgroundPresets = async () => {
    try {
      setPresetsLoading(true);
      const response = await AdminService.backgroundPresets.getActive();
      const presets = Array.isArray(response) ? response : (response?.data || []);
      setBackgroundPresets(presets);
      return presets;
    } catch {
      return [];
    } finally {
      setPresetsLoading(false);
    }
  };

  const init = async () => {
    try {
      setInitialLoading(true);
      if (isEdit && id) {
        const [detail, presets] = await Promise.all([
          AdminService.cardNews.get(id),
          fetchBackgroundPresets(),
        ]);
        setIsPublished(!!detail.publishedAt);

        const categoryCode = detail.category.code;
        if (!NEW_CATEGORY_OPTIONS.find((o) => o.code === categoryCode)) {
          setExtraCategoryOption({
            code: categoryCode,
            label: detail.category.displayName || categoryCode,
          });
        }

        reset({
          title: detail.title,
          subtitle: detail.subtitle || '',
          description: detail.description || '',
          categoryCode,
          hasReward: detail.hasReward || false,
          body: detail.body || '',
          pushTitle: detail.pushNotificationTitle || '',
          pushMessage: detail.pushNotificationMessage || '',
        });

        if (detail.backgroundImage) {
          if (detail.backgroundImage.presetName) {
            setBackgroundType('PRESET');
            const preset = presets.find(
              (p: BackgroundPreset) => p.displayName === detail.backgroundImage?.presetName,
            );
            if (preset) setSelectedPresetId(preset.id);
          } else {
            setBackgroundType('CUSTOM');
            setCustomBackgroundUrl(detail.backgroundImage.url || '');
          }
        }
      } else {
        const presets = await fetchBackgroundPresets();
        if (presets.length > 0) setSelectedPresetId(presets[0].id);
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '데이터를 불러오는데 실패했습니다.'));
    } finally {
      setInitialLoading(false);
    }
  };

  const handlePresetSelect = (preset: BackgroundPreset) => {
    setSelectedPresetId(preset.id);
    setBackgroundType('PRESET');
  };

  const handleBackgroundUpload = async (file: File) => {
    try {
      setUploadingBackground(true);
      const response = await AdminService.backgroundPresets.upload(file);
      setCustomBackgroundUrl(response.url);
      setBackgroundType('CUSTOM');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '이미지 업로드에 실패했습니다.'));
    } finally {
      setUploadingBackground(false);
    }
  };

  const handlePresetEdit = (preset: BackgroundPreset) => {
    setEditingPreset(preset);
    setPresetEditModalOpen(true);
  };

  const handlePresetDelete = async (presetId: string) => {
    try {
      await AdminService.backgroundPresets.delete(presetId);
      if (selectedPresetId === presetId) setSelectedPresetId('');
      await fetchBackgroundPresets();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '프리셋 삭제에 실패했습니다.'));
    }
  };

  const handleCancel = async () => {
    if (!isDirty) {
      router.push('/admin/content?tab=longform');
      return;
    }
    const ok = await confirmAction({
      title: '작성 취소',
      message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
    });
    if (ok) {
      router.push('/admin/content?tab=longform');
    }
  };

  const buildPayload = (data: LongformFormData): CreateCardNewsRequest => ({
    title: data.title.trim(),
    subtitle: data.subtitle?.trim() || undefined,
    description: data.description.trim(),
    categoryCode: data.categoryCode,
    layoutMode: 'longform',
    hasReward: data.hasReward,
    body: data.body,
    backgroundImage:
      backgroundType === 'PRESET'
        ? { type: 'PRESET' as const, presetId: selectedPresetId }
        : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
    ...(data.pushTitle?.trim() ? { pushNotificationTitle: data.pushTitle.trim() } : {}),
    ...(data.pushMessage?.trim() ? { pushNotificationMessage: data.pushMessage.trim() } : {}),
  });

  const validateBackground = () => {
    if (backgroundType === 'PRESET' && !selectedPresetId) {
      toast.error('배경 프리셋을 선택해주세요.');
      return false;
    }
    if (backgroundType === 'CUSTOM' && !customBackgroundUrl) {
      toast.error('배경 이미지를 업로드해주세요.');
      return false;
    }
    return true;
  };

  const persist = async (data: LongformFormData): Promise<string | null> => {
    if (!validateBackground()) return null;
    const payload = buildPayload(data);
    try {
      if (isEdit && id) {
        const updatePayload = {
          title: payload.title,
          subtitle: payload.subtitle,
          description: payload.description,
          hasReward: payload.hasReward,
          body: payload.body,
          backgroundImage: payload.backgroundImage,
          ...(payload.pushNotificationTitle
            ? { pushNotificationTitle: payload.pushNotificationTitle }
            : {}),
          ...(payload.pushNotificationMessage
            ? { pushNotificationMessage: payload.pushNotificationMessage }
            : {}),
        };
        await AdminService.cardNews.update(id, updatePayload);
        toast.success('롱폼 아티클이 수정되었습니다.');
        return id;
      }
      const created = await AdminService.cardNews.create(payload);
      toast.success('롱폼 아티클이 생성되었습니다.');
      return created.id;
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
      return null;
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    const savedId = await persist(data);
    if (savedId) {
      router.push('/admin/content?tab=longform');
    }
  });

  const onSubmitAndPublish = handleFormSubmit(async (data) => {
    const savedId = await persist(data);
    if (!savedId) return;
    try {
      const values = getValues();
      const result = await AdminService.cardNews.publish(savedId, {
        ...(values.pushTitle?.trim() ? { pushNotificationTitle: values.pushTitle.trim() } : {}),
        ...(values.pushMessage?.trim()
          ? { pushNotificationMessage: values.pushMessage.trim() }
          : {}),
      });
      if (result.success) {
        toast.success(
          values.pushMessage?.trim()
            ? `푸시 알림이 ${result.sentCount ?? 0}명에게 발송되었습니다.`
            : '롱폼 아티클이 발행되었습니다.',
        );
        router.push('/admin/content?tab=longform');
      } else {
        toast.error('발행에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '발행에 실패했습니다.'));
    }
  });

  if (initialLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {isEdit ? '롱폼 아티클 수정' : '새 롱폼 아티클 작성'}
        </Typography>
      </Box>

      {isEdit && isPublished && (
        <Alert severity="info" sx={{ mb: 2 }}>
          이미 발행된 콘텐츠입니다. 수정한 내용이 즉시 반영됩니다.
        </Alert>
      )}

      <Box
        sx={{
          display: 'flex',
          gap: 3,
          alignItems: 'flex-start',
          flexDirection: { xs: 'column', lg: 'row' },
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              기본 정보
            </Typography>

            <Controller
              name="title"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="제목"
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
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  label="부제목 (선택 사항)"
                  inputProps={{ maxLength: 100 }}
                  helperText={
                    fieldState.error?.message ?? `${(field.value ?? '').length}/100자`
                  }
                  error={!!fieldState.error}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="설명"
                  inputProps={{ maxLength: 100 }}
                  helperText={fieldState.error?.message ?? `${field.value.length}/100자`}
                  error={!!fieldState.error}
                  sx={{ mb: 2 }}
                  required
                />
              )}
            />

            <Controller
              name="categoryCode"
              control={control}
              render={({ field, fieldState }) => (
                <FormControl fullWidth sx={{ mb: 2 }} required error={!!fieldState.error}>
                  <InputLabel>카테고리</InputLabel>
                  <Select {...field} label="카테고리">
                    {categoryOptions.map((c) => (
                      <MenuItem key={c.code} value={c.code}>
                        {c.label}
                      </MenuItem>
                    ))}
                  </Select>
                  {fieldState.error && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                      {fieldState.error.message}
                    </Typography>
                  )}
                </FormControl>
              )}
            />

            <Divider sx={{ my: 3 }} />

            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Hero 이미지
            </Typography>
            <BackgroundSelector
              presets={backgroundPresets}
              selectedPresetId={selectedPresetId}
              customBackgroundUrl={customBackgroundUrl}
              backgroundType={backgroundType}
              loading={presetsLoading}
              uploadingBackground={uploadingBackground}
              onPresetSelect={handlePresetSelect}
              onPresetEdit={handlePresetEdit}
              onCustomUpload={handleBackgroundUpload}
              onCustomClear={() => setCustomBackgroundUrl('')}
              onBackgroundTypeChange={setBackgroundType}
              onAddPresetClick={() => setPresetUploadModalOpen(true)}
            />

            <Divider sx={{ my: 3 }} />

            <Controller
              name="hasReward"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Checkbox checked={field.value} onChange={field.onChange} />}
                  label="구슬 보상 제공"
                />
              )}
            />
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">본문</Typography>
              <Typography variant="caption" color="text.secondary">
                예상 읽기 시간 {readTimeMinutes}분
              </Typography>
            </Box>
            <Controller
              name="body"
              control={control}
              render={({ field, fieldState }) => (
                <Box>
                  <MarkdownEditor
                    value={field.value}
                    onChange={field.onChange}
                    minHeight={600}
                  />
                  {fieldState.error && (
                    <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                      {fieldState.error.message}
                    </Typography>
                  )}
                </Box>
              )}
            />
          </Paper>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              푸시 알림 설정
            </Typography>

            <Controller
              name="pushTitle"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  label="푸시 알림 제목 (선택 사항)"
                  inputProps={{ maxLength: 50 }}
                  helperText={
                    fieldState.error?.message ??
                    `${(field.value ?? '').length}/50자 | 비워두면 콘텐츠 제목이 사용됩니다.`
                  }
                  error={!!fieldState.error}
                  sx={{ mb: 2 }}
                />
              )}
            />

            <Controller
              name="pushMessage"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  value={field.value ?? ''}
                  fullWidth
                  label="푸시 알림 메시지 (선택 사항)"
                  inputProps={{ maxLength: 100 }}
                  helperText={
                    fieldState.error?.message ?? `${(field.value ?? '').length}/100자`
                  }
                  error={!!fieldState.error}
                  multiline
                  rows={2}
                />
              )}
            />
          </Paper>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
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
            <Button
              variant="contained"
              color="success"
              startIcon={isSubmitting ? <CircularProgress size={20} /> : <SendIcon />}
              onClick={onSubmitAndPublish}
              disabled={isSubmitting}
            >
              저장 후 발행
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            width: { xs: '100%', lg: 460 },
            flexShrink: 0,
            position: { lg: 'sticky' },
            top: { lg: 24 },
            alignSelf: 'flex-start',
          }}
        >
          <LongformPreview
            title={watchedTitle}
            subtitle={watchedSubtitle}
            description={watchedDescription}
            categoryLabel={categoryLabel}
            heroImageUrl={previewBackgroundUrl}
            body={watchedBody}
            readTimeMinutes={readTimeMinutes}
          />
        </Box>
      </Box>

      <PresetUploadModal
        open={presetUploadModalOpen}
        onClose={() => setPresetUploadModalOpen(false)}
        onSuccess={fetchBackgroundPresets}
      />

      <PresetEditModal
        open={presetEditModalOpen}
        preset={editingPreset}
        onClose={() => {
          setPresetEditModalOpen(false);
          setEditingPreset(null);
        }}
        onSuccess={fetchBackgroundPresets}
        onDelete={handlePresetDelete}
      />
    </Box>
  );
}
