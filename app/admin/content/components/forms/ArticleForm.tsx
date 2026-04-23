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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import ImageUploader from '../article/ImageUploader';
import MarkdownEditor from '../article/MarkdownEditor';
import type { CreateSometimeArticleRequest, UpdateSometimeArticleRequest } from '@/types/admin';
import SaveIcon from '@mui/icons-material/Save';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAdminForm } from '@/app/admin/hooks/forms';
import {
  sometimeArticleSchema,
  type SometimeArticleFormValues,
} from '@/app/admin/hooks/forms/schemas/sometime-article.schema';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import {
  LEGACY_CATEGORY_LABELS,
  NEW_CATEGORY_OPTIONS,
} from '../../constants';

const STATUS_OPTIONS = [
  { value: 'draft', label: '초안' },
  { value: 'scheduled', label: '예약됨' },
  { value: 'published', label: '발행됨' },
  { value: 'archived', label: '보관' },
] as const;

const generateSlug = (title: string): string =>
  title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

interface Props {
  mode: 'create' | 'edit';
  id?: string;
}

export function ArticleForm({ mode, id }: Props) {
  const router = useRouter();
  const toast = useToast();
  const confirmAction = useConfirm();
  const isEdit = mode === 'edit';

  const {
    control,
    watch,
    setValue,
    reset,
    handleFormSubmit,
    formState: { isSubmitting, errors },
  } = useAdminForm<SometimeArticleFormValues>({
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
  const content = watch('content');
  const thumbnailUrl = watch('thumbnailUrl');
  const coverImageUrl = watch('coverImageUrl');
  const authorAvatar = watch('authorAvatar');
  const ogImage = watch('ogImage');
  const currentCategory = watch('category');

  useEffect(() => {
    if (isEdit && id) {
      (async () => {
        try {
          const detail = await AdminService.sometimeArticles.get(id);
          reset({
            title: detail.title,
            subtitle: detail.subtitle || '',
            slug: detail.slug,
            category: detail.category,
            status: detail.status,
            excerpt: detail.excerpt || '',
            content: detail.content || '',
            thumbnailUrl: detail.thumbnail?.url || '',
            coverImageUrl: detail.coverImage?.url || '',
            authorId: detail.author?.id || '',
            authorName: detail.author?.name || '',
            authorRole: detail.author?.role || '',
            authorAvatar: detail.author?.avatar || '',
            metaTitle: detail.seo?.metaTitle || '',
            metaDescription: detail.seo?.metaDescription || '',
            ogImage: detail.seo?.ogImage || '',
            keywords: detail.seo?.keywords?.join(', ') || '',
          });
        } catch (err: unknown) {
          toast.error(getApiErrorMessage(err, '아티클 로드 실패'));
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleTitleChange = (value: string) => {
    setValue('title', value);
    const currentSlug = slug;
    if (!currentSlug || currentSlug === generateSlug(title)) {
      setValue('slug', generateSlug(value));
    }
  };

  const handleCancel = async () => {
    const ok = await confirmAction({
      title: '작성 취소',
      message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
    });
    if (ok) {
      router.push('/admin/content?tab=article');
    }
  };

  const onSubmit = handleFormSubmit(async (data) => {
    const baseSeo =
      data.metaTitle.trim() ||
      data.metaDescription.trim() ||
      data.ogImage.trim() ||
      data.keywords.trim()
        ? {
            ...(data.metaTitle.trim() ? { metaTitle: data.metaTitle.trim() } : {}),
            ...(data.metaDescription.trim()
              ? { metaDescription: data.metaDescription.trim() }
              : {}),
            ...(data.ogImage.trim() ? { ogImage: data.ogImage.trim() } : {}),
            ...(data.keywords.trim()
              ? {
                  keywords: data.keywords
                    .split(',')
                    .map((k) => k.trim())
                    .filter(Boolean),
                }
              : {}),
          }
        : undefined;

    try {
      if (isEdit && id) {
        const updatePayload: UpdateSometimeArticleRequest = {
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
          ...(baseSeo ? { seo: baseSeo } : {}),
          ...(data.status === 'published' && { publishedAt: new Date().toISOString() }),
        };
        await AdminService.sometimeArticles.update(id, updatePayload);
        toast.success('아티클이 수정되었습니다.');
      } else {
        const createPayload: CreateSometimeArticleRequest = {
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
          ...(baseSeo ? { seo: baseSeo } : {}),
          ...(data.status === 'published' && { publishedAt: new Date().toISOString() }),
        };
        await AdminService.sometimeArticles.create(createPayload);
        toast.success('아티클이 생성되었습니다.');
      }
      router.push('/admin/content?tab=article');
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
    }
  });

  const categoryIsLegacy = !NEW_CATEGORY_OPTIONS.some(
    (c) => (c.code as string) === (currentCategory as string),
  );

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={handleCancel} sx={{ mr: 2 }}>
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          {isEdit ? '아티클 수정' : '새 아티클 작성'}
        </Typography>
      </Box>

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
              helperText={
                fieldState.error?.message ??
                'URL에 사용될 고유 식별자입니다. 제목에서 자동 생성됩니다.'
              }
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
                  {NEW_CATEGORY_OPTIONS.map((option) => (
                    <MenuItem key={option.code} value={option.code}>
                      {option.label}
                    </MenuItem>
                  ))}
                  {categoryIsLegacy && currentCategory && (
                    <MenuItem value={currentCategory}>
                      {LEGACY_CATEGORY_LABELS[currentCategory] || currentCategory} (레거시)
                    </MenuItem>
                  )}
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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          히어로 이미지
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          썸네일 또는 커버 이미지 중 최소 하나는 지정해주세요.
        </Typography>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          썸네일
        </Typography>
        <ImageUploader
          value={thumbnailUrl}
          onChange={(url) => setValue('thumbnailUrl', url)}
        />
        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
          커버 이미지
        </Typography>
        <ImageUploader
          value={coverImageUrl}
          onChange={(url) => setValue('coverImageUrl', url)}
        />
        {!thumbnailUrl && !coverImageUrl && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            썸네일 또는 커버 이미지 중 하나는 필요합니다.
          </Alert>
        )}
      </Paper>

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

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          작성자
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Controller
            name="authorId"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="작성자 ID"
                {...field}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                required
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
                inputProps={{ maxLength: 50 }}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
                required
              />
            )}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Controller
            name="authorRole"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="역할"
                {...field}
                inputProps={{ maxLength: 50 }}
                helperText={fieldState.error?.message}
                error={!!fieldState.error}
              />
            )}
          />
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary">
              작성자 아바타
            </Typography>
            <ImageUploader
              value={authorAvatar}
              onChange={(url) => setValue('authorAvatar', url)}
            />
          </Box>
        </Box>
      </Paper>

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
                inputProps={{ maxLength: 160 }}
                helperText={fieldState.error?.message ?? `${field.value.length}/160자`}
                error={!!fieldState.error}
                multiline
                rows={2}
                sx={{ mb: 2 }}
              />
            )}
          />
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              OG 이미지
            </Typography>
            <ImageUploader value={ogImage} onChange={(url) => setValue('ogImage', url)} />
          </Box>
          <Controller
            name="keywords"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                label="키워드 (쉼표로 구분)"
                {...field}
                helperText={fieldState.error?.message ?? '예: 연애, 데이트, 소개팅'}
                error={!!fieldState.error}
              />
            )}
          />
        </AccordionDetails>
      </Accordion>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mb: 3 }}>
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
