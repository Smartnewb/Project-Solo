'use client';

import { useEffect } from 'react';
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
import { useAdminForm } from '@/app/admin/hooks/forms';
import { sometimeArticleSchema, SometimeArticleFormValues } from '@/app/admin/hooks/forms/schemas/sometime-article.schema';

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

function CreateSometimeArticlePageContent() {
  const router = useRouter();

  const { control, register, watch, setValue, handleFormSubmit, formState: { isSubmitting, errors } } =
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

  const title = watch('title');
  const slug = watch('slug');
  const subtitle = watch('subtitle');
  const excerpt = watch('excerpt');
  const content = watch('content');
  const thumbnailUrl = watch('thumbnailUrl');
  const coverImageUrl = watch('coverImageUrl');
  const authorAvatar = watch('authorAvatar');
  const metaTitle = watch('metaTitle');
  const metaDescription = watch('metaDescription');
  const ogImage = watch('ogImage');

  const handleTitleChange = (value: string) => {
    setValue('title', value);
    const currentSlug = slug;
    if (!currentSlug || currentSlug === generateSlug(title)) {
      setValue('slug', generateSlug(value));
    }
  };

  const handleCancel = () => {
    if (confirm('작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?')) {
      router.push('/admin/sometime-articles');
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    const requestData: CreateSometimeArticleRequest = {
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
      ...(data.subtitle.trim() && { subtitle: data.subtitle.trim() }),
      ...(data.excerpt.trim() && { excerpt: data.excerpt.trim() }),
      ...(data.thumbnailUrl.trim() && {
        thumbnail: { type: 'image', url: data.thumbnailUrl.trim() },
      }),
      ...(data.coverImageUrl.trim() && {
        coverImage: { type: 'image', url: data.coverImageUrl.trim() },
      }),
      ...((data.metaTitle.trim() || data.metaDescription.trim() || data.ogImage.trim() || data.keywords.trim()) && {
        seo: {
          ...(data.metaTitle.trim() && { metaTitle: data.metaTitle.trim() }),
          ...(data.metaDescription.trim() && { metaDescription: data.metaDescription.trim() }),
          ...(data.ogImage.trim() && { ogImage: data.ogImage.trim() }),
          ...(data.keywords.trim() && { keywords: data.keywords.split(',').map((k) => k.trim()).filter(Boolean) }),
        },
      }),
      ...(data.status === 'published' && { publishedAt: new Date().toISOString() }),
    };

    await AdminService.sometimeArticles.create(requestData);
    alert('아티클이 성공적으로 생성되었습니다.');
    router.push('/admin/sometime-articles');
  });

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
              onChange={(e) => handleTitleChange(e.target.value)}
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
              helperText={fieldState.error?.message ?? 'URL에 사용될 고유 식별자입니다. 제목에서 자동 생성됩니다.'}
              error={!!fieldState.error}
              sx={{ mb: 2 }}
              required
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
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </Box>
    </Box>
  );
}

export default function CreateSometimeArticlePage() {
  return (
    <CreateSometimeArticlePageContent />
  );
}
