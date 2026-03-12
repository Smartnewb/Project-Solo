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
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../../components/CardEditor';
import PresetUploadModal from '../../components/PresetUploadModal';
import PresetEditModal from '../../components/PresetEditModal';
import BackgroundSelector from '../../components/BackgroundSelector';
import CardNewsPreview from '../../components/CardNewsPreview';
import CardNewsDetailPreview from '../../components/CardNewsDetailPreview';
import type { BackgroundPreset } from '@/types/admin';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LegacyPageAdapter } from '@/shared/ui/admin/legacy-page-adapter';

interface CardSection {
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [pushTitle, setPushTitle] = useState('');
  const [pushMessage, setPushMessage] = useState('');
  const [hasReward, setHasReward] = useState(false);
  const [backgroundType, setBackgroundType] = useState<'PRESET' | 'CUSTOM'>('PRESET');
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
  const [backgroundPresets, setBackgroundPresets] = useState<BackgroundPreset[]>([]);
  const [sections, setSections] = useState<CardSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [presetUploadModalOpen, setPresetUploadModalOpen] = useState(false);
  const [presetEditModalOpen, setPresetEditModalOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<BackgroundPreset | null>(null);
  const [presetsLoading, setPresetsLoading] = useState(false);

  // 미리보기용 배경 이미지 URL 계산
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
    fetchData();
  }, [id]);

  const fetchBackgroundPresets = async () => {
    try {
      setPresetsLoading(true);
      const response = await AdminService.backgroundPresets.getActive();
      const presets = Array.isArray(response) ? response : (response?.data || []);
      setBackgroundPresets(presets);
    } catch (err: any) {
      console.error('배경 프리셋 목록 조회 실패:', err);
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

      setTitle(cardNewsData.title);
      setDescription(cardNewsData.description || '');
      setCategoryCode(cardNewsData.category.code);
      setPushTitle(cardNewsData.pushNotificationTitle || '');
      setPushMessage(cardNewsData.pushNotificationMessage || '');
      setHasReward(cardNewsData.hasReward || false);
      setSections(cardNewsData.sections || []);
      setCategories(categoriesData);
      const presets = Array.isArray(presetsData) ? presetsData : (presetsData?.data || []);
      setBackgroundPresets(presets);
      setIsPublished(!!cardNewsData.publishedAt);

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
      console.error('데이터 로드 실패:', err);
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
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
      console.error('배경 이미지 업로드 실패:', err);
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
      console.error('프리셋 삭제 실패:', err);
      alert(err.response?.data?.message || '프리셋 삭제에 실패했습니다.');
    }
  };

  const handleAddCard = () => {
    if (isPublished) {
      alert('발행된 카드뉴스의 섹션은 수정할 수 없습니다.');
      return;
    }

    if (sections.length >= 7) {
      alert('최대 7개의 카드까지만 추가할 수 있습니다.');
      return;
    }

    setSections([
      ...sections,
      {
        order: sections.length,
        title: '',
        content: '',
        imageUrl: undefined
      }
    ]);
  };

  const handleUpdateSection = (index: number, updatedSection: CardSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    if (isPublished) {
      alert('발행된 카드뉴스의 섹션은 수정할 수 없습니다.');
      return;
    }

    if (sections.length <= 1) {
      alert('최소 1개의 카드가 필요합니다.');
      return;
    }

    const newSections = sections.filter((_, i) => i !== index);
    newSections.forEach((section, i) => {
      section.order = i;
    });
    setSections(newSections);
  };

  const validateForm = () => {
    if (!title.trim() || title.length > 50) {
      setError('제목을 올바르게 입력해주세요 (최대 50자).');
      return false;
    }

    if (!description.trim() || description.length > 100) {
      setError('설명을 올바르게 입력해주세요 (최대 100자).');
      return false;
    }

    if (backgroundType === 'PRESET' && !selectedPresetId) {
      setError('배경 프리셋을 선택해주세요.');
      return false;
    }

    if (backgroundType === 'CUSTOM' && !customBackgroundUrl) {
      setError('배경 이미지를 업로드해주세요.');
      return false;
    }

    if (!isPublished) {
      for (let i = 0; i < sections.length; i++) {
        if (!sections[i].title.trim() || sections[i].title.length > 50) {
          setError(`카드 ${i + 1}의 제목을 올바르게 입력해주세요 (최대 50자).`);
          return false;
        }

        if (!sections[i].content.trim() || sections[i].content.length > 500) {
          setError(`카드 ${i + 1}의 본문을 올바르게 입력해주세요 (최대 500자).`);
          return false;
        }
      }
    }

    if (pushTitle && pushTitle.length > 50) {
      setError('푸시 알림 제목은 최대 50자까지 입력 가능합니다.');
      return false;
    }

    if (pushMessage && pushMessage.length > 100) {
      setError('푸시 알림 메시지는 최대 100자까지 입력 가능합니다.');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const data: any = {
        title: title.trim(),
        description: description.trim(),
        backgroundImage: backgroundType === 'PRESET'
          ? { type: 'PRESET' as const, presetId: selectedPresetId }
          : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
        hasReward,
        ...(pushTitle.trim() && { pushNotificationTitle: pushTitle.trim() }),
        ...(pushMessage.trim() && { pushNotificationMessage: pushMessage.trim() })
      };

      if (!isPublished) {
        data.sections = sections.map(section => ({
          order: section.order,
          title: section.title.trim(),
          content: section.content,
          ...(section.imageUrl && { imageUrl: section.imageUrl })
        }));
      }

      await AdminService.cardNews.update(id, data);
      alert('카드뉴스가 성공적으로 수정되었습니다.');
      router.push('/admin/card-news');
    } catch (err: any) {
      console.error('카드뉴스 수정 실패:', err);
      const errorMessage = err.response?.data?.message || '카드뉴스 수정에 실패했습니다.';

      if (errorMessage.includes('섹션은 수정할 수 없습니다')) {
        setError('발행된 카드뉴스의 섹션은 수정할 수 없습니다. 제목, 설명, 푸시 메시지만 수정 가능합니다.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('수정 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/card-news');
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>카드뉴스를 불러오는 중...</Typography>
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
          카드뉴스 수정
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 미리보기 */}
      <CardNewsPreview
        title={title}
        description={description}
        backgroundImageUrl={previewBackgroundUrl}
        hasReward={hasReward}
      />

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          기본 정보
        </Typography>

        {isPublished && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            발행된 카드뉴스입니다. 제목, 설명, 배경 이미지, 보상, 푸시 메시지만 수정 가능합니다. 섹션은 수정할 수 없습니다.
          </Alert>
        )}

        <TextField
          fullWidth
          label="카드뉴스 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드뉴스 제목을 입력하세요 (최대 50자)"
          inputProps={{ maxLength: 50 }}
          helperText={`${title.length}/50자`}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          label="카드뉴스 설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="카드뉴스 설명을 입력하세요 (최대 100자)"
          inputProps={{ maxLength: 100 }}
          helperText={`${description.length}/100자`}
          sx={{ mb: 2 }}
          required
        />

        <FormControl fullWidth sx={{ mb: 2 }} disabled>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={categoryCode}
            label="카테고리"
          >
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

        <FormControlLabel
          control={
            <Checkbox
              checked={hasReward}
              onChange={(e) => setHasReward(e.target.checked)}
            />
          }
          label="구슬 보상 제공 (마지막 카드 도달 시 구슬 1개 지급)"
        />

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          푸시 알림 설정
        </Typography>

        <TextField
          fullWidth
          label="푸시 알림 제목 (선택 사항)"
          value={pushTitle}
          onChange={(e) => setPushTitle(e.target.value)}
          placeholder="예: 썸타임 새소식 🎉"
          inputProps={{ maxLength: 50 }}
          helperText={`${pushTitle.length}/50자 | 비워두면 카드뉴스 제목이 사용됩니다.`}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="푸시 알림 메시지 (선택 사항)"
          value={pushMessage}
          onChange={(e) => setPushMessage(e.target.value)}
          placeholder="푸시 알림 메시지를 입력하세요 (최대 100자)"
          inputProps={{ maxLength: 100 }}
          helperText={`${pushMessage.length}/100자 | 발행 시 모든 활성 사용자에게 전송됩니다. 설정하지 않으면 발행할 수 없습니다.`}
          multiline
          rows={2}
        />
      </Paper>

      {!isPublished && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              카드 섹션 ({sections.length}/7)
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleAddCard}
              disabled={sections.length >= 7}
            >
              카드 추가
            </Button>
          </Box>

          {sections.map((section, index) => (
            <CardEditor
              key={index}
              section={section}
              onUpdate={(updatedSection) => handleUpdateSection(index, updatedSection)}
              onDelete={() => handleDeleteSection(index)}
              canDelete={sections.length > 1}
            />
          ))}
        </Box>
      )}

      {isPublished && (
        <Alert severity="info" sx={{ mb: 3 }}>
          발행된 카드뉴스는 섹션을 수정할 수 없습니다. 섹션 내용을 확인만 할 수 있습니다.
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button
          variant="outlined"
          onClick={handleCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={loading}
        >
          {loading ? '저장 중...' : '수정 완료'}
        </Button>
      </Box>

      {/* 카드뉴스 상세 미리보기 */}
      <CardNewsDetailPreview sections={sections} />

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
  return (
    <LegacyPageAdapter>
      <EditCardNewsPageContent />
    </LegacyPageAdapter>
  );
}
