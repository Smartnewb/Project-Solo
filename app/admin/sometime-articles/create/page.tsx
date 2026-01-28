'use client';

import { useState } from 'react';
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import ImageUploader from '../components/ImageUploader';
import MarkdownEditor from '../components/MarkdownEditor';
import type {
  SometimeArticleStatus,
  SometimeArticleCategory,
  CreateSometimeArticleRequest,
} from '@/types/admin';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const STATUS_OPTIONS: { value: SometimeArticleStatus; label: string }[] = [
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약됨' },
  { value: 'published', label: '발행됨' },
];

const CATEGORY_OPTIONS: { value: SometimeArticleCategory; label: string }[] = [
  { value: 'story', label: '스토리' },
  { value: 'interview', label: '인터뷰' },
  { value: 'tips', label: '팁' },
  { value: 'team', label: '팀 소개' },
  { value: 'update', label: '업데이트' },
  { value: 'safety', label: '안전 가이드' },
];

const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

export default function CreateSometimeArticlePage() {
  const router = useRouter();

  // Basic Info
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<SometimeArticleCategory>('story');
  const [status, setStatus] = useState<SometimeArticleStatus>('draft');

  // Content
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');

  // Media
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');

  // Author
  const [authorId, setAuthorId] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorRole, setAuthorRole] = useState('');
  const [authorAvatar, setAuthorAvatar] = useState('');

  // SEO
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [keywords, setKeywords] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  };

  const validateForm = (): boolean => {
    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return false;
    }
    if (title.length > 200) {
      setError('제목은 최대 200자까지 입력 가능합니다.');
      return false;
    }
    if (!slug.trim()) {
      setError('슬러그를 입력해주세요.');
      return false;
    }
    if (!category) {
      setError('카테고리를 선택해주세요.');
      return false;
    }
    if (!content.trim()) {
      setError('본문을 입력해주세요.');
      return false;
    }
    if (!authorId.trim()) {
      setError('작성자 ID를 입력해주세요.');
      return false;
    }
    if (!authorName.trim()) {
      setError('작성자 이름을 입력해주세요.');
      return false;
    }
    if (authorName.length > 50) {
      setError('작성자 이름은 최대 50자까지 입력 가능합니다.');
      return false;
    }
    if (metaTitle && metaTitle.length > 60) {
      setError('메타 타이틀은 최대 60자까지 입력 가능합니다.');
      return false;
    }
    if (metaDescription && metaDescription.length > 160) {
      setError('메타 설명은 최대 160자까지 입력 가능합니다.');
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

      const data: CreateSometimeArticleRequest = {
        slug: slug.trim(),
        status,
        category,
        title: title.trim(),
        content: content.trim(),
        author: {
          id: authorId.trim(),
          name: authorName.trim(),
          ...(authorRole.trim() && { role: authorRole.trim() }),
          ...(authorAvatar.trim() && { avatar: authorAvatar.trim() }),
        },
        ...(subtitle.trim() && { subtitle: subtitle.trim() }),
        ...(excerpt.trim() && { excerpt: excerpt.trim() }),
        ...(thumbnailUrl.trim() && {
          thumbnail: { type: 'image', url: thumbnailUrl.trim() },
        }),
        ...(coverImageUrl.trim() && {
          coverImage: { type: 'image', url: coverImageUrl.trim() },
        }),
        ...((metaTitle.trim() || metaDescription.trim() || ogImage.trim() || keywords.trim()) && {
          seo: {
            ...(metaTitle.trim() && { metaTitle: metaTitle.trim() }),
            ...(metaDescription.trim() && { metaDescription: metaDescription.trim() }),
            ...(ogImage.trim() && { ogImage: ogImage.trim() }),
            ...(keywords.trim() && { keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean) }),
          },
        }),
        ...(status === 'published' && { publishedAt: new Date().toISOString() }),
      };

      await AdminService.sometimeArticles.create(data);
      alert('아티클이 성공적으로 생성되었습니다.');
      router.push('/admin/sometime-articles');
    } catch (err: any) {
      console.error('아티클 생성 실패:', err);
      setError(err.response?.data?.message || '아티클 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/sometime-articles');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          새 아티클 작성
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 기본 정보 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          기본 정보
        </Typography>

        <TextField
          fullWidth
          label="제목"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="아티클 제목을 입력하세요"
          inputProps={{ maxLength: 200 }}
          helperText={`${title.length}/200자`}
          sx={{ mb: 2 }}
          required
        />

        <TextField
          fullWidth
          label="부제목"
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="부제목을 입력하세요 (선택)"
          inputProps={{ maxLength: 300 }}
          helperText={`${subtitle.length}/300자`}
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="슬러그"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="url-friendly-slug"
          helperText="URL에 사용될 고유 식별자입니다. 제목에서 자동 생성됩니다."
          sx={{ mb: 2 }}
          required
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl fullWidth required>
            <InputLabel>카테고리</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value as SometimeArticleCategory)}
              label="카테고리"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>상태</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as SometimeArticleStatus)}
              label="상태"
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* 콘텐츠 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          콘텐츠
        </Typography>

        <TextField
          fullWidth
          label="요약"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="아티클 요약을 입력하세요 (선택)"
          inputProps={{ maxLength: 500 }}
          helperText={`${excerpt.length}/500자`}
          multiline
          rows={2}
          sx={{ mb: 3 }}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          본문 (Markdown) *
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          이미지 버튼을 클릭하여 본문 중간에 이미지를 삽입할 수 있습니다.
        </Typography>
        <MarkdownEditor
          value={content}
          onChange={setContent}
          placeholder="마크다운 형식으로 본문을 작성하세요..."
          minHeight={500}
        />
      </Paper>

      {/* 미디어 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          미디어
        </Typography>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px' }}>
            <ImageUploader
              value={thumbnailUrl}
              onChange={setThumbnailUrl}
              label="썸네일 이미지"
              helperText="목록에 표시될 썸네일 (JPG, PNG, GIF, WEBP, 최대 10MB)"
              previewHeight={180}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <ImageUploader
              value={coverImageUrl}
              onChange={setCoverImageUrl}
              label="커버 이미지"
              helperText="아티클 상단에 표시될 커버 (JPG, PNG, GIF, WEBP, 최대 10MB)"
              previewHeight={180}
            />
          </Box>
        </Box>
      </Paper>

      {/* 작성자 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 3 }}>
          작성자
        </Typography>

        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <Box sx={{ flex: '1 1 200px' }}>
            <TextField
              fullWidth
              label="작성자 ID"
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              placeholder="author-id"
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="작성자 이름"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="홍길동"
              inputProps={{ maxLength: 50 }}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="역할"
              value={authorRole}
              onChange={(e) => setAuthorRole(e.target.value)}
              placeholder="에디터 (선택)"
              inputProps={{ maxLength: 50 }}
            />
          </Box>
          <Box sx={{ flex: '0 0 200px' }}>
            <ImageUploader
              value={authorAvatar}
              onChange={setAuthorAvatar}
              label="아바타 이미지"
              helperText="작성자 프로필 이미지 (선택)"
              previewHeight={150}
            />
          </Box>
        </Box>
      </Paper>

      {/* SEO */}
      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h6">SEO 설정 (선택)</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <TextField
            fullWidth
            label="메타 타이틀"
            value={metaTitle}
            onChange={(e) => setMetaTitle(e.target.value)}
            placeholder="검색 엔진에 표시될 제목"
            inputProps={{ maxLength: 60 }}
            helperText={`${metaTitle.length}/60자`}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="메타 설명"
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            placeholder="검색 결과에 표시될 설명"
            inputProps={{ maxLength: 160 }}
            helperText={`${metaDescription.length}/160자`}
            multiline
            rows={2}
            sx={{ mb: 3 }}
          />

          <Box sx={{ mb: 2 }}>
            <ImageUploader
              value={ogImage}
              onChange={setOgImage}
              label="OG 이미지"
              helperText="소셜 미디어 공유 시 표시될 이미지"
              previewHeight={150}
            />
          </Box>

          <TextField
            fullWidth
            label="키워드"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="키워드1, 키워드2, 키워드3"
            helperText="쉼표로 구분하여 입력하세요"
          />
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
        <Button variant="outlined" onClick={handleCancel} disabled={loading}>
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
