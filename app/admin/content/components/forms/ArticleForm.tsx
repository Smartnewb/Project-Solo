'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description, Select, ListBox } from '@heroui/react';
import { Save as SaveIcon, ArrowLeft as ArrowBackIcon, ChevronDown as ExpandMoreIcon } from 'lucide-react';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import ImageUploader from '../article/ImageUploader';
import MarkdownEditor from '../article/MarkdownEditor';
import { OgPreviewCard } from '../seo/OgPreviewCard';
import type { CreateSometimeArticleRequest, UpdateSometimeArticleRequest } from '@/types/admin';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { useUnsavedGuard } from '@/app/admin/hooks/use-unsaved-guard';
import { sometimeArticleSchema, type SometimeArticleFormValues, } from '@/app/admin/hooks/forms/schemas/sometime-article.schema';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { LEGACY_CATEGORY_LABELS, NEW_CATEGORY_OPTIONS, } from '../../constants';
const STATUS_OPTIONS = [
    { value: 'draft', label: '초안' },
    { value: 'scheduled', label: '예약됨' },
    { value: 'published', label: '발행됨' },
    { value: 'archived', label: '보관' },
] as const;
const generateSlug = (title: string): string => title
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
    const { control, watch, setValue, reset, handleFormSubmit, formState: { isSubmitting, isDirty, errors }, } = useAdminForm<SometimeArticleFormValues>({
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
            scheduledAt: '',
        },
    });
    useUnsavedGuard(isDirty, isSubmitting);
    const title = watch('title');
    const slug = watch('slug');
    const content = watch('content');
    const thumbnailUrl = watch('thumbnailUrl');
    const coverImageUrl = watch('coverImageUrl');
    const authorAvatar = watch('authorAvatar');
    const ogImage = watch('ogImage');
    const currentCategory = watch('category');
    const watchedStatus = watch('status');
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
                        scheduledAt: detail.status === 'scheduled' && detail.publishedAt
                            ? detail.publishedAt
                            : '',
                    });
                }
                catch (err: unknown) {
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
        if (data.status === 'scheduled' && !data.scheduledAt) {
            toast.error('예약 발행 시각을 입력해주세요.');
            return;
        }
        const baseSeo = data.metaTitle.trim() ||
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
                    ...(data.status === 'published'
                        ? { publishedAt: new Date().toISOString() }
                        : data.status === 'scheduled' && data.scheduledAt
                            ? { publishedAt: data.scheduledAt }
                            : {}),
                };
                await AdminService.sometimeArticles.update(id, updatePayload);
                toast.success('아티클이 수정되었습니다.');
            }
            else {
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
                    ...(data.status === 'published'
                        ? { publishedAt: new Date().toISOString() }
                        : data.status === 'scheduled' && data.scheduledAt
                            ? { publishedAt: data.scheduledAt }
                            : {}),
                };
                await AdminService.sometimeArticles.create(createPayload);
                toast.success('아티클이 생성되었습니다.');
            }
            router.push('/admin/content?tab=article');
        }
        catch (err: unknown) {
            const status = (err as {
                response?: {
                    status?: number;
                };
                status?: number;
            })?.response?.status ??
                (err as {
                    status?: number;
                })?.status;
            if (status === 409) {
                toast.error('이미 사용 중인 슬러그입니다. 다른 값을 입력해주세요.');
                return;
            }
            toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
        }
    });
    const categoryIsLegacy = !NEW_CATEGORY_OPTIONS.some((c) => (c.code as string) === (currentCategory as string));
    return (<>
    <div style={{ padding: 24, maxWidth: 1200, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button onPress={handleCancel} variant="tertiary" style={{ marginRight: 16 }}>{<ArrowBackIcon></ArrowBackIcon>}
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? '아티클 수정' : '새 아티클 작성'}
        </h1>
      </div>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
          기본 정보
        </h2>

        <Controller name="title" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"제목"}</Label><Input {...field} onChange={(e) => handleTitleChange(e.target.value)} required {...{ maxLength: 200 }}></Input><Description>{fieldState.error?.message ?? `${field.value.length}/200자`}</Description></TextField>)}></Controller>

        <Controller name="subtitle" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"부제목"}</Label><Input {...field} {...{ maxLength: 300 }}></Input><Description>{fieldState.error?.message ?? `${field.value.length}/300자`}</Description></TextField>)}></Controller>

        <Controller name="slug" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"슬러그"}</Label><Input {...field} required></Input><Description>{fieldState.error?.message ??
                'URL에 사용될 고유 식별자입니다. 제목에서 자동 생성됩니다.'}</Description></TextField>)}></Controller>

        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Controller name="category" control={control} render={({ field }) => (<div>
                <label>카테고리</label>
                <Select {...field} aria-label={"카테고리"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  {NEW_CATEGORY_OPTIONS.map((option) => (<ListBox.Item key={option.code} id={option.code} textValue={String(option.label)}>
                      {option.label}
                    </ListBox.Item>))}
                  {isEdit && categoryIsLegacy && currentCategory && (<ListBox.Item id={currentCategory} textValue={String(LEGACY_CATEGORY_LABELS[currentCategory] || currentCategory) + (" " + "(\uB808\uAC70\uC2DC)")}>
                      {LEGACY_CATEGORY_LABELS[currentCategory] || currentCategory} (레거시)
                    </ListBox.Item>)}
                </ListBox></Select.Popover></Select>
              </div>)}></Controller>

          <Controller name="status" control={control} render={({ field }) => (<div>
                <label>상태</label>
                <Select {...field} aria-label={"상태"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                  {STATUS_OPTIONS.map((option) => (<ListBox.Item key={option.value} id={option.value} textValue={String(option.label)}>
                      {option.label}
                    </ListBox.Item>))}
                </ListBox></Select.Popover></Select>
              </div>)}></Controller>
        </div>

        {watchedStatus === 'scheduled' && (<Controller name="scheduledAt" control={control} render={({ field, fieldState }) => (<TextField isRequired isInvalid={!!fieldState.error}><Label>예약 발행 시각</Label><Input type="datetime-local" value={field.value ? new Date(new Date(field.value).getTime() - new Date(field.value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={event => field.onChange(event.target.value ? new Date(event.target.value).toISOString() : '')}/><Description>{fieldState.error?.message ?? '미래 시각으로 설정해주세요.'}</Description></TextField>)}></Controller>)}
      </section>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
          히어로 이미지
        </h2>
        <p style={{ marginBottom: 16 }}>
          썸네일 또는 커버 이미지 중 최소 하나는 지정해주세요.
        </p>
        <p style={{ marginBottom: 8 }}>
          썸네일
        </p>
        <ImageUploader value={thumbnailUrl} onChange={(url) => setValue('thumbnailUrl', url)}></ImageUploader>
        <p style={{ marginTop: 16, marginBottom: 8 }}>
          커버 이미지
        </p>
        <ImageUploader value={coverImageUrl} onChange={(url) => setValue('coverImageUrl', url)}></ImageUploader>
        {!thumbnailUrl && !coverImageUrl && (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>
            썸네일 또는 커버 이미지 중 하나는 필요합니다.
          </aside>)}
      </section>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
          콘텐츠
        </h2>

        <Controller name="excerpt" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"요약"}</Label><TextArea {...field} rows={2} {...{ maxLength: 500 }}></TextArea><Description>{fieldState.error?.message ?? `${field.value.length}/500자`}</Description></TextField>)}></Controller>

        <p style={{ marginBottom: 8 }}>
          본문 (Markdown) *
        </p>
        <MarkdownEditor value={content} onChange={(val) => setValue('content', val)} placeholder="마크다운 형식으로 본문을 작성하세요..." minHeight={500}></MarkdownEditor>
        {errors.content && (<p style={{ marginTop: 4, display: 'block' }}>
            {errors.content.message}
          </p>)}
      </section>

      <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
        <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
          작성자
        </h2>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          <Controller name="authorId" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"작성자 ID"}</Label><Input {...field} required></Input><Description>{fieldState.error?.message}</Description></TextField>)}></Controller>
          <Controller name="authorName" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"작성자 이름"}</Label><Input {...field} required {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message}</Description></TextField>)}></Controller>
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Controller name="authorRole" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"역할"}</Label><Input {...field} {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message}</Description></TextField>)}></Controller>
          <div style={{ flex: 1 }}>
            <p>
              작성자 아바타
            </p>
            <ImageUploader value={authorAvatar} onChange={(url) => setValue('authorAvatar', url)}></ImageUploader>
          </div>
        </div>
      </section>

      {isEdit && slug && (<div style={{ marginBottom: 24 }}>
          <OgPreviewCard path={`/blog/${slug}`} webUrl={AdminService.seo.getWebPageUrl('blog', slug)}></OgPreviewCard>
        </div>)}

      <details style={{ marginBottom: 24 }}>
        <summary>
          <h2 className="text-lg font-semibold">SEO 설정 (선택)</h2>
        </summary>
        <div>
          <Controller name="metaTitle" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"메타 타이틀"}</Label><Input {...field} {...{ maxLength: 60 }}></Input><Description>{fieldState.error?.message ?? `${field.value.length}/60자`}</Description></TextField>)}></Controller>
          <Controller name="metaDescription" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"메타 설명"}</Label><TextArea {...field} rows={2} {...{ maxLength: 160 }}></TextArea><Description>{fieldState.error?.message ?? `${field.value.length}/160자`}</Description></TextField>)}></Controller>
          <div style={{ marginBottom: 16 }}>
            <p>
              OG 이미지
            </p>
            <ImageUploader value={ogImage} onChange={(url) => setValue('ogImage', url)}></ImageUploader>
          </div>
          <Controller name="keywords" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"키워드 (쉼표로 구분)"}</Label><Input {...field}></Input><Description>{fieldState.error?.message ?? '예: 연애, 데이트, 소개팅'}</Description></TextField>)}></Controller>
        </div>
      </details>

      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end', marginBottom: 24 }}>
        <Button onPress={handleCancel} isDisabled={isSubmitting} variant="secondary">
          취소
        </Button>
        <Button isDisabled={isSubmitting} variant="primary" onPress={() => void onSubmit()}>{isSubmitting ? <Spinner size="sm"></Spinner> : <SaveIcon></SaveIcon>}
          {isSubmitting ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
    </>);
}
