'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
  Snackbar,
} from '@mui/material';
import { Controller, useFieldArray } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../components/CardEditor';
import PresetUploadModal from '../components/PresetUploadModal';
import PresetEditModal from '../components/PresetEditModal';
import BackgroundSelector from '../components/BackgroundSelector';
import CardNewsPreview from '../components/CardNewsPreview';
import CardNewsDetailPreview from '../components/CardNewsDetailPreview';
import type { BackgroundPreset } from '@/types/admin';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RestoreIcon from '@mui/icons-material/Restore';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { cardNewsFormSchema, type CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';

const DRAFT_KEY = 'card-news-create-draft';

interface Category {
  id: string;
  displayName: string;
  code: string;
  emojiUrl: string;
}

function CreateCardNewsPageContent() {
  const router = useRouter();

  const { control, watch, reset, handleFormSubmit, formState: { isSubmitting } } = useAdminForm<CardNewsFormData>({
    schema: cardNewsFormSchema,
    defaultValues: {
      title: '',
      description: '',
      categoryCode: '',
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
  const watchedPushTitle = watch('pushTitle') ?? '';
  const watchedPushMessage = watch('pushMessage') ?? '';
  const watchedSections = watch('sections');

  // Non-form state
  const [categories, setCategories] = useState<Category[]>([]);
  const [backgroundType, setBackgroundType] = useState<'PRESET' | 'CUSTOM'>('PRESET');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
  const [backgroundPresets, setBackgroundPresets] = useState<BackgroundPreset[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [presetUploadModalOpen, setPresetUploadModalOpen] = useState(false);
  const [presetEditModalOpen, setPresetEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<BackgroundPreset | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [showDraftPrompt, setShowDraftPrompt] = useState(false);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Auto-save draft ---
  const formValues = watch();
  useEffect(() => {
    if (categoriesLoading) return;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      try {
        const draft = {
          form: formValues,
          backgroundType,
          selectedPresetId,
          customBackgroundUrl,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch { /* ignore quota errors */ }
    }, 1000);
    return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
  }, [formValues, backgroundType, selectedPresetId, customBackgroundUrl, categoriesLoading]);

  // Check for draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        const savedAt = new Date(draft.savedAt);
        const hoursSince = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60);
        if (hoursSince < 24) {
          setShowDraftPrompt(true);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const restoreDraft = useCallback(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      reset(draft.form);
      if (draft.backgroundType) setBackgroundType(draft.backgroundType);
      if (draft.selectedPresetId) setSelectedPresetId(draft.selectedPresetId);
      if (draft.customBackgroundUrl) setCustomBackgroundUrl(draft.customBackgroundUrl);
      setDraftRestored(true);
    } catch { /* ignore */ }
    setShowDraftPrompt(false);
  }, [reset]);

  const dismissDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setShowDraftPrompt(false);
  }, []);

  const previewBackgroundUrl = useMemo(() => {
    if (backgroundType === 'CUSTOM' && customBackgroundUrl) return customBackgroundUrl;
    if (backgroundType === 'PRESET' && selectedPresetId) {
      const preset = backgroundPresets.find(p => p.id === selectedPresetId);
      return preset?.imageUrl || preset?.thumbnailUrl;
    }
    return undefined;
  }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);

  useEffect(() => {
    fetchCategories();
    fetchBackgroundPresets();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await AdminService.cardNews.getCategories();
      setCategories(data);
    } catch {
      setSubmitError('카테고리 목록을 불러오는데 실패했습니다.');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchBackgroundPresets = async () => {
    try {
      setPresetsLoading(true);
      const response = await AdminService.backgroundPresets.getActive();
      const presets = Array.isArray(response) ? response : (response?.data || []);
      setBackgroundPresets(presets);
      if (presets.length > 0 && !selectedPresetId) {
        setSelectedPresetId(presets[0].id);
      }
    } catch {
      // non-critical
    } finally {
      setPresetsLoading(false);
    }
  };

  const handlePresetUploadSuccess = async () => {
    await fetchBackgroundPresets();
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
    } catch (err: any) {
      alert(err.response?.data?.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingBackground(false);
    }
  };

  const handleCustomBackgroundClear = () => {
    setCustomBackgroundUrl('');
  };

  const handlePresetEdit = (preset: BackgroundPreset) => {
    setEditingPreset(preset);
    setPresetEditModalOpen(true);
  };

  const handlePresetDelete = async (presetId: string) => {
    try {
      await AdminService.backgroundPresets.delete(presetId);
      if (selectedPresetId === presetId) {
        setSelectedPresetId('');
      }
      await fetchBackgroundPresets();
    } catch (err: any) {
      alert(err.response?.data?.message || '프리셋 삭제에 실패했습니다.');
    }
  };

  const handleAddCard = () => {
    if (fields.length >= 7) {
      alert('최대 7개의 카드까지만 추가할 수 있습니다.');
      return;
    }
    append({ order: fields.length, title: '', content: '', imageUrl: undefined });
  };

  const handleDuplicateCard = (index: number) => {
    if (fields.length >= 7) {
      alert('최대 7개의 카드까지만 추가할 수 있습니다.');
      return;
    }
    const source = watchedSections[index];
    append({
      order: fields.length,
      title: source.title,
      content: source.content,
      imageUrl: source.imageUrl,
    });
  };

  const handleDeleteSection = (index: number) => {
    if (fields.length <= 1) {
      alert('최소 1개의 카드가 필요합니다.');
      return;
    }
    remove(index);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from !== to) move(from, to);
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      localStorage.removeItem(DRAFT_KEY);
      router.push('/admin/card-news');
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

    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      categoryCode: data.categoryCode,
      backgroundImage: backgroundType === 'PRESET'
        ? { type: 'PRESET' as const, presetId: selectedPresetId }
        : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
      hasReward: data.hasReward,
      sections: data.sections.map((section, i) => ({
        order: i,
        title: section.title.trim(),
        content: section.content,
        ...(section.imageUrl && { imageUrl: section.imageUrl })
      })),
      ...(data.pushTitle?.trim() && { pushNotificationTitle: data.pushTitle.trim() }),
      ...(data.pushMessage?.trim() && { pushNotificationMessage: data.pushMessage.trim() })
    };

    await AdminService.cardNews.create(payload);
    localStorage.removeItem(DRAFT_KEY);
    alert('카드뉴스가 성공적으로 생성되었습니다.');
    router.push('/admin/card-news');
  });

  if (categoriesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>카테고리 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Draft restore prompt */}
      {showDraftPrompt && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" size="small" startIcon={<RestoreIcon />} onClick={restoreDraft}>
                복원
              </Button>
              <Button color="inherit" size="small" onClick={dismissDraft}>
                무시
              </Button>
            </Box>
          }
        >
          이전에 작성하던 임시 저장본이 있습니다. 복원하시겠습니까?
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleCancel}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          새 카드뉴스 작성
        </Typography>
      </Box>

      {submitError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}

      {/* Side-by-side layout */}
      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left: Editor */}
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
                  label="카드뉴스 제목"
                  placeholder="카드뉴스 제목을 입력하세요 (최대 50자)"
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
                  label="카드뉴스 설명"
                  placeholder="카드뉴스 설명을 입력하세요 (최대 100자)"
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
                    {categories.map((category) => (
                      <MenuItem key={category.code} value={category.code}>
                        {category.displayName}
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
              onCustomClear={handleCustomBackgroundClear}
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
                  label="구슬 보상 제공 (마지막 카드 도달 시 구슬 1개 지급)"
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
                  placeholder="푸시 알림 제목을 입력하세요"
                  inputProps={{ maxLength: 50 }}
                  helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/50자 | 비워두면 카드뉴스 제목이 사용됩니다.`}
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
                  placeholder="푸시 알림 메시지를 입력하세요 (최대 100자)"
                  inputProps={{ maxLength: 100 }}
                  helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/100자 | 발행 시 모든 활성 사용자에게 전송됩니다.`}
                  error={!!fieldState.error}
                  multiline
                  rows={2}
                />
              )}
            />
          </Paper>

          {/* Card sections with drag & drop */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                카드 섹션 ({fields.length}/7)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddCard}
                disabled={fields.length >= 7}
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
                          <div
                            ref={draggableProvided.innerRef}
                            {...draggableProvided.draggableProps}
                          >
                            <CardEditor
                              index={index}
                              control={control}
                              onDelete={() => handleDeleteSection(index)}
                              canDelete={fields.length > 1}
                              onImageUploaded={(i, url) => update(i, { ...watchedSections[i], imageUrl: url, order: i })}
                              onImageRemoved={(i) => update(i, { ...watchedSections[i], imageUrl: undefined, order: i })}
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

        {/* Right: Sticky Preview */}
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
          <CardNewsDetailPreview sections={watchedSections} />
        </Box>
      </Box>

      {/* Draft restored snackbar */}
      <Snackbar
        open={draftRestored}
        autoHideDuration={3000}
        onClose={() => setDraftRestored(false)}
        message="임시 저장본이 복원되었습니다."
      />

      <PresetUploadModal
        open={presetUploadModalOpen}
        onClose={() => setPresetUploadModalOpen(false)}
        onSuccess={handlePresetUploadSuccess}
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

export default function CreateCardNewsPage() {
  return <CreateCardNewsPageContent />;
}
