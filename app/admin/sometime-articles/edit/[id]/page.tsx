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
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import { useRouter, useParams } from 'next/navigation';
import AdminService from '@/app/services/admin';
import ImageUploader from '../../components/ImageUploader';
import MarkdownEditor from '../../components/MarkdownEditor';
import type {
  SometimeArticleStatus,
  SometimeArticleCategory,
  UpdateSometimeArticleRequest,
  AdminSometimeArticleDetail,
} from '@/types/admin';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const STATUS_OPTIONS: { value: SometimeArticleStatus; label: string }[] = [
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약됨' },
  { value: 'published', label: '발행됨' },
  { value: 'archived', label: '보관됨' },
];

const CATEGORY_OPTIONS: { value: SometimeArticleCategory; label: string }[] = [
  { value: 'story', label: '스토리' },
  { value: 'interview', label: '인터뷰' },
  { value: 'tips', label: '팁' },
  { value: 'team', label: '팀 소개' },
  { value: 'update', label: '업데이트' },
  { value: 'safety', label: '안전 가이드' },
];

export default function EditSometimeArticlePage() {
  const router = useRouter();
  const params = useParams();
  const id = (params?.id || '') as string;

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

  // Stats (read-only)
  const [viewCount, setViewCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setInitialLoading(true);
      const data: AdminSometimeArticleDetail = await AdminService.sometimeArticles.get(id);

      setTitle(data.title);
      setSubtitle(data.subtitle || '');
      setSlug(data.slug);
      setCategory(data.category);
      setStatus(data.status);
      setExcerpt(data.excerpt || '');
      setContent(data.content);
      setThumbnailUrl(data.thumbnail?.url || '');
      setCoverImageUrl(data.coverImage?.url || '');

      if (data.author) {
        setAuthorId(data.author.id);
        setAuthorName(data.author.name);
        setAuthorRole(data.author.role || '');
        setAuthorAvatar(data.author.avatar || '');
      }

      if (data.seo) {
        setMetaTitle(data.seo.metaTitle || '');
        setMetaDescription(data.seo.metaDescription || '');
        setOgImage(data.seo.ogImage || '');
        setKeywords(data.seo.keywords?.join(', ') || '');
      }

      setViewCount(data.viewCount);
      setShareCount(data.shareCount);
      setIsPublished(data.status === 'published');
    } catch (err: any) {
      console.error('아티클 조회 실패:', err);
      setError(err.response?.data?.message || '아티클을 불러오는데 실패했습니다.');
    } finally {
      setInitialLoading(false);
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

      const data: UpdateSometimeArticleRequest = {
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
        subtitle: subtitle.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        thumbnail: thumbnailUrl.trim() ? { type: 'image', url: thumbnailUrl.trim() } : undefined,
        coverImage: coverImageUrl.trim() ? { type: 'image', url: coverImageUrl.trim() } : undefined,
        seo: (metaTitle.trim() || metaDescription.trim() || ogImage.trim() || keywords.trim())
          ? {
              metaTitle: metaTitle.trim() || undefined,
              metaDescription: metaDescription.trim() || undefined,
              ogImage: ogImage.trim() || undefined,
              keywords: keywords.trim() ? keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
            }
          : undefined,
        ...(status === 'published' && !isPublished && { publishedAt: new Date().toISOString() }),
      };

      await AdminService.sometimeArticles.update(id, data);
      alert('아티클이 성공적으로 수정되었습니다.');
      router.push('/admin/sometime-articles');
    } catch (err: any) {
      console.error('아티클 수정 실패:', err);
      setError(err.response?.data?.message || '아티클 수정에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('수정 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/sometime-articles');
    }
  };

  if (initialLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>아티클을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          아티클 수정
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 통계 정보 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              조회수
            </Typography>
            <Typography variant="h6">{viewCount.toLocaleString()}</Typography>
          </Box>
          <Divider orientation="vertical" flexItem />
          <Box>
            <Typography variant="caption" color="text.secondary">
              공유수
            </Typography>
            <Typography variant="h6">{shareCount.toLocaleString()}</Typography>
          </Box>
          {isPublished && (
            <>
              <Divider orientation="vertical" flexItem />
              <Chip label="발행됨" color="success" size="small" />
            </>
          )}
        </Box>
      </Paper>

      {isPublished && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          발행된 아티클입니다. 슬러그를 변경하면 기존 URL로의 접근이 불가능할 수 있습니다.
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
          onChange={(e) => setTitle(e.target.value)}
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
          helperText={
            isPublished
              ? '주의: 슬러그 변경 시 기존 URL이 작동하지 않을 수 있습니다.'
              : 'URL에 사용될 고유 식별자입니다.'
          }
          sx={{ mb: 2 }}
          required
          color={isPublished ? 'warning' : 'primary'}
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
          {loading ? '저장 중...' : '수정 완료'}
        </Button>
      </Box>
    </Box>
  );
}
