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
import { patchAdminAxios } from '@/shared/lib/http/admin-axios-interceptor';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { cardNewsFormSchema, type CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';

interface Category {
  id: string;
  displayName: string;
  code: string;
  emojiUrl: string;
}

function CreateCardNewsPageContent() {
  const router = useRouter();

  useEffect(() => {
    const unpatch = patchAdminAxios();
    return () => unpatch();
  }, []);

  const { control, watch, handleFormSubmit, formState: { isSubmitting } } = useAdminForm<CardNewsFormData>({
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

  const { fields, append, remove, update } = useFieldArray({ control, name: 'sections' });

  const watchedTitle = watch('title');
  const watchedDescription = watch('description');
  const watchedHasReward = watch('hasReward');
  const watchedPushTitle = watch('pushTitle') ?? '';
  const watchedPushMessage = watch('pushMessage') ?? '';
  const watchedSections = watch('sections');

  // Non-form state (file upload related)
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

  const previewBackgroundUrl = useMemo(() => {
    if (backgroundType === 'CUSTOM' && customBackgroundUrl) {
      return customBackgroundUrl;
    }
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

  const handleDeleteSection = (index: number) => {
    if (fields.length <= 1) {
      alert('최소 1개의 카드가 필요합니다.');
      return;
    }
    remove(index);
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
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
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
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

      {/* 미리보기 */}
      <CardNewsPreview
        title={watchedTitle}
        description={watchedDescription}
        backgroundImageUrl={previewBackgroundUrl}
        hasReward={watchedHasReward}
      />

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
              control={
                <Checkbox
                  checked={field.value}
                  onChange={field.onChange}
                />
              }
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
              placeholder="예: 썸타임 새소식 🎉"
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
              helperText={fieldState.error?.message ?? `${(field.value ?? '').length}/100자 | 발행 시 모든 활성 사용자에게 전송됩니다. 설정하지 않으면 발행할 수 없습니다.`}
              error={!!fieldState.error}
              multiline
              rows={2}
            />
          )}
        />
      </Paper>

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

        {fields.map((field, index) => (
          <CardEditor
            key={field.id}
            section={watchedSections[index] ?? field}
            onUpdate={(updatedSection) => update(index, { ...updatedSection, order: index })}
            onDelete={() => handleDeleteSection(index)}
            canDelete={fields.length > 1}
          />
        ))}
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
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

      {/* 카드뉴스 상세 미리보기 */}
      <CardNewsDetailPreview sections={watchedSections} />

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
  return (
    <CreateCardNewsPageContent />
  );
}
