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
  Alert,
  CircularProgress,
  Divider,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Controller, useFieldArray } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '@/app/admin/card-news/components/CardEditor';
import PresetUploadModal from '@/app/admin/card-news/components/PresetUploadModal';
import PresetEditModal from '@/app/admin/card-news/components/PresetEditModal';
import BackgroundSelector from '@/app/admin/card-news/components/BackgroundSelector';
import CardNewsPreview from '@/app/admin/card-news/components/CardNewsPreview';
import CardNewsDetailPreview from '@/app/admin/card-news/components/CardNewsDetailPreview';
import type { BackgroundPreset } from '@/types/admin';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { cardNewsFormSchema, type CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';

const NEW_CATEGORY_OPTIONS: { code: string; label: string }[] = [
  { code: 'relationship', label: '연애' },
  { code: 'dating', label: '데이트' },
  { code: 'psychology', label: '심리' },
  { code: 'essay', label: '에세이' },
  { code: 'qna', label: '질의응답' },
  { code: 'event', label: '이벤트' },
];

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

export function CardSeriesForm({ mode, id }: Props) {
  const router = useRouter();
  const isEdit = mode === 'edit';

  const { control, watch, reset, handleFormSubmit, formState: { isSubmitting } } =
    useAdminForm<CardNewsFormData>({
      schema: cardNewsFormSchema,
      defaultValues: {
        title: '',
        description: '',
        categoryCode: '',
        layoutMode: 'image_only',
        hasReward: false,
        pushTitle: '',
        pushMessage: '',
        sections: [{ order: 0, title: '', content: '', imageUrl: undefined }],
      },
    });

  const { fields, append, remove, update, move } = useFieldArray({ control, name: 'sections' });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedHasReward = watch('hasReward');
  const watchedLayoutMode = watch('layoutMode');
  const watchedSections = watch('sections');

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
  const [submitError, setSubmitError] = useState<string | null>(null);

  const previewBackgroundUrl = useMemo(() => {
    if (backgroundType === 'CUSTOM' && customBackgroundUrl) return customBackgroundUrl;
    if (backgroundType === 'PRESET' && selectedPresetId) {
      const preset = backgroundPresets.find((p) => p.id === selectedPresetId);
      return preset?.imageUrl || preset?.thumbnailUrl;
    }
    return undefined;
  }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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
        const [cardNewsData, presets] = await Promise.all([
          AdminService.cardNews.get(id),
          fetchBackgroundPresets(),
        ]);
        setIsPublished(!!cardNewsData.publishedAt);
        reset({
          title: cardNewsData.title,
          description: cardNewsData.description || '',
          categoryCode: cardNewsData.category.code,
          layoutMode: cardNewsData.layoutMode || 'image_only',
          hasReward: cardNewsData.hasReward || false,
          pushTitle: cardNewsData.pushNotificationTitle || '',
          pushMessage: cardNewsData.pushNotificationMessage || '',
          sections: cardNewsData.sections || [],
        });
        if (cardNewsData.backgroundImage) {
          if (cardNewsData.backgroundImage.presetName) {
            setBackgroundType('PRESET');
            const preset = presets.find(
              (p: BackgroundPreset) => p.displayName === cardNewsData.backgroundImage?.presetName,
            );
            if (preset) setSelectedPresetId(preset.id);
          } else {
            setBackgroundType('CUSTOM');
            setCustomBackgroundUrl(cardNewsData.backgroundImage.url || '');
          }
        }
      } else {
        const presets = await fetchBackgroundPresets();
        if (presets.length > 0) setSelectedPresetId(presets[0].id);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
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
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || '이미지 업로드에 실패했습니다.');
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
      const error = err as { response?: { data?: { message?: string } } };
      alert(error.response?.data?.message || '프리셋 삭제에 실패했습니다.');
    }
  };

  const handleAddCard = () => {
    if (isEdit && isPublished) {
      alert('발행된 카드시리즈의 섹션은 수정할 수 없습니다.');
      return;
    }
    if (fields.length >= 7) {
      alert('최대 7개의 카드까지만 추가할 수 있습니다.');
      return;
    }
    append({ order: fields.length, title: '', content: '', imageUrl: undefined });
  };

  const handleDuplicateCard = (index: number) => {
    if (isEdit && isPublished) return;
    if (fields.length >= 7) return;
    const source = watchedSections[index];
    append({
      order: fields.length,
      title: source.title,
      content: source.content,
      imageUrl: source.imageUrl,
    });
  };

  const handleDeleteSection = (index: number) => {
    if (isEdit && isPublished) return;
    if (fields.length <= 1) return;
    remove(index);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    if (isEdit && isPublished) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from !== to) move(from, to);
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/content?tab=card-series');
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    if (backgroundType === 'PRESET' && !selectedPresetId) {
      setSubmitError('배경 프리셋을 선택해주세요.');
      return;
    }
    if (backgroundType === 'CUSTOM' && !customBackgroundUrl) {
      setSubmitError('배경 이미지를 업로드해주세요.');
      return;
    }
    setSubmitError(null);

    const basePayload = {
      title: data.title.trim(),
      description: data.description.trim(),
      layoutMode: data.layoutMode,
      backgroundImage:
        backgroundType === 'PRESET'
          ? { type: 'PRESET' as const, presetId: selectedPresetId }
          : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
      hasReward: data.hasReward,
      ...(data.pushTitle?.trim() ? { pushNotificationTitle: data.pushTitle.trim() } : {}),
      ...(data.pushMessage?.trim() ? { pushNotificationMessage: data.pushMessage.trim() } : {}),
    };

    const sections = data.sections.map((section, i) => ({
      order: i,
      title: section.title.trim(),
      content: section.content,
      ...(section.imageUrl ? { imageUrl: section.imageUrl } : {}),
    }));

    try {
      if (isEdit && id) {
        const updatePayload: Record<string, unknown> = { ...basePayload };
        if (!isPublished) updatePayload.sections = sections;
        await AdminService.cardNews.update(id, updatePayload);
        alert('카드시리즈가 수정되었습니다.');
      } else {
        await AdminService.cardNews.create({
          ...basePayload,
          categoryCode: data.categoryCode,
          sections,
        });
        alert('카드시리즈가 생성되었습니다.');
      }
      router.push('/admin/content?tab=card-series');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setSubmitError(error.response?.data?.message || '저장에 실패했습니다.');
    }
  });

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
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
          {isEdit ? '카드시리즈 수정' : '새 카드시리즈 작성'}
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
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

            {!isEdit && (
              <Controller
                name="categoryCode"
                control={control}
                render={({ field, fieldState }) => (
                  <FormControl fullWidth sx={{ mb: 2 }} required error={!!fieldState.error}>
                    <InputLabel>카테고리</InputLabel>
                    <Select {...field} label="카테고리">
                      {NEW_CATEGORY_OPTIONS.map((c) => (
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
            )}

            <Divider sx={{ my: 3 }} />

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

            <Divider sx={{ my: 3 }} />

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
                  helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/100자`}
                  error={!!fieldState.error}
                  multiline
                  rows={2}
                />
              )}
            />
          </Paper>

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">카드 섹션 ({fields.length}/7)</Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCard}
                disabled={fields.length >= 7 || (isEdit && isPublished)}
              >
                카드 추가
              </Button>
            </Box>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="card-sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    {fields.map((field, index) => (
                      <Draggable key={field.id} draggableId={field.id} index={index}>
                        {(draggableProvided) => (
                          <div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                            <CardEditor
                              index={index}
                              control={control}
                              layoutMode={watchedLayoutMode}
                              onDelete={() => handleDeleteSection(index)}
                              canDelete={fields.length > 1 && !(isEdit && isPublished)}
                              onImageUploaded={(i, url) =>
                                update(i, { ...watchedSections[i], imageUrl: url, order: i })
                              }
                              onImageRemoved={(i) =>
                                update(i, { ...watchedSections[i], imageUrl: undefined, order: i })
                              }
                              onDuplicate={handleDuplicateCard}
                              dragHandleProps={draggableProvided.dragHandleProps ?? undefined}
                            />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </Box>

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
          <CardNewsPreview
            title={watchedTitle}
            description={watchedDescription}
            backgroundImageUrl={previewBackgroundUrl}
            hasReward={watchedHasReward}
          />
          <CardNewsDetailPreview sections={watchedSections} layoutMode={watchedLayoutMode} />
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
