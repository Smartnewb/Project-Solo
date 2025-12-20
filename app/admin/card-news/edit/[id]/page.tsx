'use client';

import { useState, useEffect } from 'react';
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
  Divider
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../../components/CardEditor';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

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

export default function EditCardNewsPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [pushMessage, setPushMessage] = useState('');
  const [sections, setSections] = useState<CardSection[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setInitialLoading(true);
      const [cardNewsData, categoriesData] = await Promise.all([
        AdminService.cardNews.get(id),
        AdminService.cardNews.getCategories()
      ]);

      setTitle(cardNewsData.title);
      setCategoryCode(cardNewsData.category.code);
      setPushMessage(cardNewsData.pushNotificationMessage || '');
      setSections(cardNewsData.sections || []);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error('데이터 로드 실패:', err);
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleAddCard = () => {
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
        imageUrl: ''
      }
    ]);
  };

  const handleUpdateSection = (index: number, updatedSection: CardSection) => {
    const newSections = [...sections];
    newSections[index] = updatedSection;
    setSections(newSections);
  };

  const handleDeleteSection = (index: number) => {
    if (sections.length <= 1) {
      alert('최소 1개의 카드가 필요합니다.');
      return;
    }

    const newSections = sections.filter((_, i) => i !== index);
    // 순서 재정렬
    newSections.forEach((section, i) => {
      section.order = i;
    });
    setSections(newSections);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return false;
    }

    if (!categoryCode) {
      setError('카테고리를 선택해주세요.');
      return false;
    }

    if (sections.length < 1) {
      setError('최소 1개의 카드가 필요합니다.');
      return false;
    }

    for (let i = 0; i < sections.length; i++) {
      if (!sections[i].title.trim()) {
        setError(`카드 ${i + 1}의 제목을 입력해주세요.`);
        return false;
      }

      if (!sections[i].content.trim() || sections[i].content === '<p><br></p>') {
        setError(`카드 ${i + 1}의 본문을 입력해주세요.`);
        return false;
      }
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

      const data = {
        title: title.trim(),
        sections: sections.map(section => ({
          order: section.order,
          title: section.title.trim(),
          content: section.content,
          ...(section.imageUrl?.trim() && { imageUrl: section.imageUrl.trim() })
        })),
        ...(pushMessage.trim() && { pushNotificationMessage: pushMessage.trim() })
      };

      await AdminService.cardNews.update(id, data);
      alert('카드뉴스가 성공적으로 수정되었습니다.');
      router.push('/admin/card-news');
    } catch (err: any) {
      console.error('카드뉴스 수정 실패:', err);
      setError(err.response?.data?.message || '카드뉴스 수정에 실패했습니다.');
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          기본 정보
        </Typography>

        <TextField
          fullWidth
          label="카드뉴스 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="카드뉴스 제목을 입력하세요 (최대 50자)"
          inputProps={{ maxLength: 50 }}
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

        <TextField
          fullWidth
          label="푸시 알림 메시지 (선택 사항)"
          value={pushMessage}
          onChange={(e) => setPushMessage(e.target.value)}
          placeholder="푸시 알림 메시지를 입력하세요 (최대 100자)"
          inputProps={{ maxLength: 100 }}
          helperText="발행 시 모든 활성 사용자에게 전송됩니다. 설정하지 않으면 발행할 수 없습니다."
          multiline
          rows={2}
        />
      </Paper>

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
    </Box>
  );
}
