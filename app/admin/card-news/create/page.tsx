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
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../components/CardEditor';
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

export default function CreateCardNewsPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [categoryCode, setCategoryCode] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [pushMessage, setPushMessage] = useState('');
  const [sections, setSections] = useState<CardSection[]>([
    { order: 0, title: '', content: '', imageUrl: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      const data = await AdminService.cardNews.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('카테고리 목록 조회 실패:', err);
      setError('카테고리 목록을 불러오는데 실패했습니다.');
    } finally {
      setCategoriesLoading(false);
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
        categoryCode,
        sections: sections.map(section => ({
          order: section.order,
          title: section.title.trim(),
          content: section.content,
          ...(section.imageUrl?.trim() && { imageUrl: section.imageUrl.trim() })
        })),
        ...(pushMessage.trim() && { pushNotificationMessage: pushMessage.trim() })
      };

      await AdminService.cardNews.create(data);
      alert('카드뉴스가 성공적으로 생성되었습니다.');
      router.push('/admin/card-news');
    } catch (err: any) {
      console.error('카드뉴스 생성 실패:', err);
      setError(err.response?.data?.message || '카드뉴스 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/card-news');
    }
  };

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

        <FormControl fullWidth sx={{ mb: 2 }} required>
          <InputLabel>카테고리</InputLabel>
          <Select
            value={categoryCode}
            onChange={(e) => setCategoryCode(e.target.value)}
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
          {loading ? '저장 중...' : '저장'}
        </Button>
      </Box>
    </Box>
  );
}
