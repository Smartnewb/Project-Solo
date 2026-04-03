'use client';

import { useState, useEffect } from 'react';
import { Controller } from 'react-hook-form';
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
import { useAdminForm } from '@/app/admin/hooks/forms';
import { sometimeArticleSchema, SometimeArticleFormValues } from '@/app/admin/hooks/forms/schemas/sometime-article.schema';

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

function EditSometimeArticlePageContent() {
  const router = useRouter();

  const params = useParams();
  const id = (params?.id || '') as string;

  const [viewCount, setViewCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const { control, watch, setValue, handleFormSubmit, reset, formState: { isSubmitting, errors } } =
    useAdminForm<SometimeArticleFormValues>({
      schema: sometimeArticleSchema,
      defaultValues: {
        title: '',
        subtitle: '',
        slug: '',
        category: 'story',
        status: 'draft',
        excerpt: '',
        content: '',
        thumbnailUrl: '',
        coverImageUrl: '',
        authorId: '',
        authorName: '',
        authorRole: '',
        authorAvatar: '',
        metaTitle: '',
        metaDescription: '',
        ogImage: '',
        keywords: '',
      },
    });

  const content = watch('content');
  const thumbnailUrl = watch('thumbnailUrl');
  const coverImageUrl = watch('coverImageUrl');
  const authorAvatar = watch('authorAvatar');
  const ogImage = watch('ogImage');

  useEffect(() => {
    if (id) {
      fetchArticle();
    }
  }, [id]);

  const fetchArticle = async () => {
    try {
      setInitialLoading(true);
      const data: AdminSometimeArticleDetail = await AdminService.sometimeArticles.get(id);

      reset({
        title: data.title,
        subtitle: data.subtitle || '',
        slug: data.slug,
        category: data.category,
        status: data.status,
        excerpt: data.excerpt || '',
        content: data.content,
        thumbnailUrl: data.thumbnail?.url || '',
        coverImageUrl: data.coverImage?.url || '',
        authorId: data.author?.id || '',
        authorName: data.author?.name || '',
        authorRole: data.author?.role || '',
        authorAvatar: data.author?.avatar || '',
        metaTitle: data.seo?.metaTitle || '',
        metaDescription: data.seo?.metaDescription || '',
        ogImage: data.seo?.ogImage || '',
        keywords: data.seo?.keywords?.join(', ') || '',
      });

      setViewCount(data.viewCount);
      setShareCount(data.shareCount);
      setIsPublished(data.status === 'published');
    } catch (err: any) {
      setLoadError(err.response?.data?.message || '아티클을 불러오는데 실패했습니다.');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleCancel = () => {
    if (confirm('수정 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/sometime-articles');
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    const requestData: UpdateSometimeArticleRequest = {
      slug: data.slug.trim(),
      status: data.status,
      category: data.category,
      title: data.title.trim(),
      content: data.content.trim(),
      author: {
        id: data.authorId.trim(),
        name: data.authorName.trim(),
        ...(data.authorRole.trim() && { role: data.authorRole.trim() }),
        ...(data.authorAvatar.trim() && { avatar: data.authorAvatar.trim() }),
      },
      subtitle: data.subtitle.trim() || undefined,
      excerpt: data.excerpt.trim() || undefined,
      thumbnail: data.thumbnailUrl.trim() ? { type: 'image', url: data.thumbnailUrl.trim() } : undefined,
      coverImage: data.coverImageUrl.trim() ? { type: 'image', url: data.coverImageUrl.trim() } : undefined,
      seo: (data.metaTitle.trim() || data.metaDescription.trim() || data.ogImage.trim() || data.keywords.trim())
        ? {
            metaTitle: data.metaTitle.trim() || undefined,
            metaDescription: data.metaDescription.trim() || undefined,
            ogImage: data.ogImage.trim() || undefined,
            keywords: data.keywords.trim() ? data.keywords.split(',').map((k) => k.trim()).filter(Boolean) : undefined,
          }
        : undefined,
      ...(data.status === 'published' && !isPublished && { publishedAt: new Date().toISOString() }),
    };

    await AdminService.sometimeArticles.update(id, requestData);
    alert('아티클이 성공적으로 수정되었습니다.');
    router.push('/admin/sometime-articles');
  });

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

      {loadError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setLoadError(null)}>
          {loadError}
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

        <Controller
          name="title"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              fullWidth
              label="제목"
              {...field}
              placeholder="아티클 제목을 입력하세요"
              inputProps={{ maxLength: 200 }}
              helperText={fieldState.error?.message ?? `${field.value.length}/200자`}
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
              fullWidth
              label="부제목"
              {...field}
              placeholder="부제목을 입력하세요 (선택)"
              inputProps={{ maxLength: 300 }}
              helperText={fieldState.error?.message ?? `${field.value.length}/300자`}
              error={!!fieldState.error}
              sx={{ mb: 2 }}
            />
          )}
        />

        <Controller
          name="slug"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              fullWidth
              label="슬러그"
              {...field}
              placeholder="url-friendly-slug"
              helperText={
                fieldState.error?.message ??
                (isPublished
                  ? '주의: 슬러그 변경 시 기존 URL이 작동하지 않을 수 있습니다.'
                  : 'URL에 사용될 고유 식별자입니다.')
              }
              error={!!fieldState.error}
              sx={{ mb: 2 }}
              required
              color={isPublished ? 'warning' : 'primary'}
            />
          )}
        />

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth required>
                <InputLabel>카테고리</InputLabel>
                <Select {...field} label="카테고리">
                  {CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />

          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth>
                <InputLabel>상태</InputLabel>
                <Select {...field} label="상태">
                  {STATUS_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          />
        </Box>
      </Paper>

      {/* 콘텐츠 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          콘텐츠
        </Typography>

        <Controller
          name="excerpt"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              fullWidth
              label="요약"
              {...field}
              placeholder="아티클 요약을 입력하세요 (선택)"
              inputProps={{ maxLength: 500 }}
              helperText={fieldState.error?.message ?? `${field.value.length}/500자`}
              error={!!fieldState.error}
              multiline
              rows={2}
              sx={{ mb: 3 }}
            />
          )}
        />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          본문 (Markdown) *
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
          이미지 버튼을 클릭하여 본문 중간에 이미지를 삽입할 수 있습니다.
        </Typography>
        <MarkdownEditor
          value={content}
          onChange={(val) => setValue('content', val)}
          placeholder="마크다운 형식으로 본문을 작성하세요..."
          minHeight={500}
        />
        {errors.content && (
          <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
            {errors.content.message}
          </Typography>
        )}
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
              onChange={(val) => setValue('thumbnailUrl', val)}
              label="썸네일 이미지"
              helperText="목록에 표시될 썸네일 (JPG, PNG, GIF, WEBP, 최대 10MB)"
              previewHeight={180}
            />
          </Box>
          <Box sx={{ flex: '1 1 300px' }}>
            <ImageUploader
              value={coverImageUrl}
              onChange={(val) => setValue('coverImageUrl', val)}
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
            <Controller
              name="authorId"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  label="작성자 ID"
                  {...field}
                  placeholder="author-id"
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Controller
              name="authorName"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  label="작성자 이름"
                  {...field}
                  placeholder="홍길동"
                  inputProps={{ maxLength: 50 }}
                  required
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  sx={{ mb: 2 }}
                />
              )}
            />
            <Controller
              name="authorRole"
              control={control}
              render={({ field }) => (
                <TextField
                  fullWidth
                  label="역할"
                  {...field}
                  placeholder="에디터 (선택)"
                  inputProps={{ maxLength: 50 }}
                />
              )}
            />
          </Box>
          <Box sx={{ flex: '0 0 200px' }}>
            <ImageUploader
              value={authorAvatar}
              onChange={(val) => setValue('authorAvatar', val)}
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
          <Controller
            name="metaTitle"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="메타 타이틀"
                {...field}
                placeholder="검색 엔진에 표시될 제목"
                inputProps={{ maxLength: 60 }}
                helperText={fieldState.error?.message ?? `${field.value.length}/60자`}
                error={!!fieldState.error}
                sx={{ mb: 2 }}
              />
            )}
          />

          <Controller
            name="metaDescription"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="메타 설명"
                {...field}
                placeholder="검색 결과에 표시될 설명"
                inputProps={{ maxLength: 160 }}
                helperText={fieldState.error?.message ?? `${field.value.length}/160자`}
                error={!!fieldState.error}
                multiline
                rows={2}
                sx={{ mb: 3 }}
              />
            )}
          />

          <Box sx={{ mb: 2 }}>
            <ImageUploader
              value={ogImage}
              onChange={(val) => setValue('ogImage', val)}
              label="OG 이미지"
              helperText="소셜 미디어 공유 시 표시될 이미지"
              previewHeight={150}
            />
          </Box>

          <Controller
            name="keywords"
            control={control}
            render={({ field }) => (
              <TextField
                fullWidth
                label="키워드"
                {...field}
                placeholder="키워드1, 키워드2, 키워드3"
                helperText="쉼표로 구분하여 입력하세요"
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

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
  );
}

export default function EditSometimeArticlePage() {
  return (
    <EditSometimeArticlePageContent />
  );
}
