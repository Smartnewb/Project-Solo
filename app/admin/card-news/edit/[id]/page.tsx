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
  Checkbox
} from '@mui/material';
import { Controller, useFieldArray } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../../components/CardEditor';
import PresetUploadModal from '../../components/PresetUploadModal';
import PresetEditModal from '../../components/PresetEditModal';
import BackgroundSelector from '../../components/BackgroundSelector';
import CardNewsPreview from '../../components/CardNewsPreview';
import CardNewsDetailPreview from '../../components/CardNewsDetailPreview';
import LayoutModeSelector from '../../components/LayoutModeSelector';
import type { BackgroundPreset } from '@/types/admin';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { cardNewsFormSchema, type CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';

interface Category {
  id: string;
  displayName: string;
  code: string;
  emojiUrl: string;
}

function EditCardNewsPageContent() {
  const router = useRouter();

  const params = useParams();
  const id = (params?.id || '') as string;

  const { control, watch, reset, handleFormSubmit, formState: { isSubmitting } } = useAdminForm<CardNewsFormData>({
    schema: cardNewsFormSchema,
    defaultValues: {
      title: '',
      description: '',
      categoryCode: '',
      layoutMode: 'article',
      hasReward: false,
      pushTitle: '',
      pushMessage: '',
      sections: [],
    },
  });

  const { fields, append, remove, update, move } = useFieldArray({ control, name: 'sections' });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedHasReward = watch('hasReward');
  const watchedLayoutMode = watch('layoutMode');
  const watchedSections = watch('sections');

  // Non-form state
  const [categories, setCategories] = useState<Category[]>([]);
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
      const preset = backgroundPresets.find(p => p.id === selectedPresetId);
      return preset?.imageUrl || preset?.thumbnailUrl;
    }
    return undefined;
  }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchBackgroundPresets = async () => {
    try {
      setPresetsLoading(true);
      const response = await AdminService.backgroundPresets.getActive();
      const presets = Array.isArray(response) ? response : (response?.data || []);
      setBackgroundPresets(presets);
    } catch {
      // non-critical
    } finally {
      setPresetsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const [cardNewsData, categoriesData, presetsData] = await Promise.all([
        AdminService.cardNews.get(id),
        AdminService.cardNews.getCategories(),
        AdminService.backgroundPresets.getActive()
      ]);

      const presets = Array.isArray(presetsData) ? presetsData : (presetsData?.data || []);
      setCategories(categoriesData);
      setBackgroundPresets(presets);
      setIsPublished(!!cardNewsData.publishedAt);

      reset({
        title: cardNewsData.title,
        description: cardNewsData.description || '',
        categoryCode: cardNewsData.category.code,
        layoutMode: cardNewsData.layoutMode || 'article',
        hasReward: cardNewsData.hasReward || false,
        pushTitle: cardNewsData.pushNotificationTitle || '',
        pushMessage: cardNewsData.pushNotificationMessage || '',
        sections: cardNewsData.sections || [],
      });

      if (cardNewsData.backgroundImage) {
        if (cardNewsData.backgroundImage.presetName) {
          setBackgroundType('PRESET');
          const preset = presets.find((p: BackgroundPreset) =>
            p.displayName === cardNewsData.backgroundImage?.presetName
          );
          if (preset) {
            setSelectedPresetId(preset.id);
          }
        } else {
          setBackgroundType('CUSTOM');
          setCustomBackgroundUrl(cardNewsData.backgroundImage.url || '');
        }
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setInitialLoading(false);
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
    if (isPublished) {
      alert('발행된 카드뉴스의 섹션은 수정할 수 없습니다.');
      return;
    }
    if (fields.length >= 7) {
      alert('최대 7개의 카드까지만 추가할 수 있습니다.');
      return;
    }
    append({ order: fields.length, title: '', content: '', imageUrl: undefined });
  };

  const handleDuplicateCard = (index: number) => {
    if (isPublished) {
      alert('발행된 카드뉴스의 섹션은 수정할 수 없습니다.');
      return;
    }
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
    if (isPublished) {
      alert('발행된 카드뉴스의 섹션은 수정할 수 없습니다.');
      return;
    }
    if (fields.length <= 1) {
      alert('최소 1개의 카드가 필요합니다.');
      return;
    }
    remove(index);
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || isPublished) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from !== to) move(from, to);
  };

  const handleCancel = () => {
    if (confirm('수정 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
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

    const payload: any = {
      title: data.title.trim(),
      description: data.description.trim(),
      layoutMode: data.layoutMode,
      backgroundImage: backgroundType === 'PRESET'
        ? { type: 'PRESET' as const, presetId: selectedPresetId }
        : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
      hasReward: data.hasReward,
      ...(data.pushTitle?.trim() && { pushNotificationTitle: data.pushTitle.trim() }),
      ...(data.pushMessage?.trim() && { pushNotificationMessage: data.pushMessage.trim() })
    };

    if (!isPublished) {
      payload.sections = data.sections.map((section, i) => ({
        order: i,
        title: section.title.trim(),
        content: section.content,
        ...(section.imageUrl && { imageUrl: section.imageUrl })
      }));
    }

    try {
      await AdminService.cardNews.update(id, payload);
      alert('카드뉴스가 성공적으로 수정되었습니다.');
      router.push('/admin/card-news');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || '카드뉴스 수정에 실패했습니다.';
      if (errorMessage.includes('섹션은 수정할 수 없습니다')) {
        setSubmitError('발행된 카드뉴스의 섹션은 수정할 수 없습니다. 제목, 설명, 푸시 메시지만 수정 가능합니다.');
      } else {
        setSubmitError(errorMessage);
      }
    }
  });

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>카드뉴스를 불러오는 중...</Typography>
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
          카드뉴스 수정
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

            {isPublished && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                발행된 카드뉴스입니다. 제목, 설명, 배경 이미지, 보상, 푸시 메시지만 수정 가능합니다. 섹션은 수정할 수 없습니다.
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                레이아웃 모드
              </Typography>
              <Controller
                name="layoutMode"
                control={control}
                render={({ field }) => (
                  <LayoutModeSelector
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPublished}
                  />
                )}
              />
            </Box>

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

            <FormControl fullWidth sx={{ mb: 2 }} disabled>
              <InputLabel>카테고리</InputLabel>
              <Select value={watch('categoryCode')} label="카테고리">
                {categories.map((category) => (
                  <MenuItem key={category.code} value={category.code}>
                    {category.displayName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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

          {/* Card sections */}
          {!isPublished && (
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
                <Droppable droppableId="card-sections-edit">
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
                                layoutMode={watchedLayoutMode}
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
          )}

          {isPublished && (
            <Alert severity="info" sx={{ mb: 3 }}>
              발행된 카드뉴스는 섹션을 수정할 수 없습니다. 섹션 내용을 확인만 할 수 있습니다.
            </Alert>
          )}

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
              {isSubmitting ? '저장 중...' : '수정 완료'}
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
          <CardNewsDetailPreview sections={watchedSections} layoutMode={watchedLayoutMode} />
        </Box>
      </Box>

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

export default function EditCardNewsPage() {
  return <EditCardNewsPageContent />;
}
