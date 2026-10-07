'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description, FieldError, Checkbox, Select, ListBox } from '@heroui/react';
import { useState, useEffect, useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import BackgroundSelector from '../card-series/BackgroundSelector';
import LongformPreview from '../card-series/LongformPreview';
import MarkdownEditor from '../article/MarkdownEditor';
import PresetUploadModal from '../card-series/PresetUploadModal';
import PresetEditModal from '../card-series/PresetEditModal';
import { OgPreviewCard } from '../seo/OgPreviewCard';
import { HtmlNoticeEditor } from './HtmlNoticeEditor';
import { noticeBackground } from './notice-background';
import type { BackgroundPreset, CreateCardNewsRequest, AdminCardNewsItem, NoticeHtmlInput, NoticeHtmlState } from '@/types/admin';
import { Save, Send, ArrowLeft } from 'lucide-react';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { useUnsavedGuard } from '@/app/admin/hooks/use-unsaved-guard';
import { useLongformCategories } from '@/app/admin/hooks';
import { longformFormSchema, type LongformFormData, estimateReadTimeMinutes, LONGFORM_BODY_SOFT_LIMIT_BYTES, } from '@/app/admin/hooks/forms/schemas/longform.schema';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
interface Props {
    mode: 'create' | 'edit';
    id?: string;
    initialHtmlMode?: boolean;
}
export function LongformForm({ mode, id, initialHtmlMode = false }: Props) {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const isEdit = mode === 'edit';
    const { control, watch, reset, handleFormSubmit, getValues, setValue, formState: { isSubmitting, isDirty }, } = useAdminForm<LongformFormData>({
        schema: longformFormSchema,
        defaultValues: {
            title: '',
            displayTitle: '',
            subtitle: '',
            description: '',
            categoryCode: '',
            hasReward: false,
            body: '',
            pushTitle: '',
            pushMessage: '',
        },
    });
    const watchedValues = watch();
    const watchedTitle = watch('title');
    const watchedSubtitle = watch('subtitle');
    const watchedDescription = watch('description');
    const watchedCategoryCode = watch('categoryCode');
    const watchedBody = watch('body');
    const [htmlMode, setHtmlMode] = useState(false);
    const [htmlDirty, setHtmlDirty] = useState(false);
    const [htmlArticleId, setHtmlArticleId] = useState(id);
    const [initialNoticeState, setInitialNoticeState] = useState<NoticeHtmlState>();
    const [backgroundType, setBackgroundType] = useState<'PRESET' | 'CUSTOM'>('PRESET');
    const [selectedPresetId, setSelectedPresetId] = useState('');
    const [customBackgroundUrl, setCustomBackgroundUrl] = useState('');
    const [backgroundPresets, setBackgroundPresets] = useState<BackgroundPreset[]>([]);
    const [initialLoading, setInitialLoading] = useState(true);
    const [isPublished, setIsPublished] = useState(false);
    const [uploadingBackground, setUploadingBackground] = useState(false);
    const [presetUploadModalOpen, setPresetUploadModalOpen] = useState(false);
    const [presetEditModalOpen, setPresetEditModalOpen] = useState(false);
    const [editingPreset, setEditingPreset] = useState<BackgroundPreset | null>(null);
    const [presetsLoading, setPresetsLoading] = useState(false);
    const [extraCategoryOption, setExtraCategoryOption] = useState<{
        code: string;
        label: string;
    } | null>(null);
    const [warnedSoftLimit, setWarnedSoftLimit] = useState(false);
    const previewBackgroundUrl = useMemo(() => {
        if (backgroundType === 'CUSTOM' && customBackgroundUrl)
            return customBackgroundUrl;
        if (backgroundType === 'PRESET' && selectedPresetId) {
            const preset = backgroundPresets.find((p) => p.id === selectedPresetId);
            return preset?.imageUrl || preset?.thumbnailUrl;
        }
        return undefined;
    }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);
    const readTimeMinutes = useMemo(() => estimateReadTimeMinutes(watchedBody ?? ''), [watchedBody]);
    const { data: serverCategories } = useLongformCategories();
    const categoryOptions = useMemo(() => {
        const fromServer = (serverCategories ?? []).map((c) => ({
            code: c.code,
            label: c.displayName,
        }));
        const base = fromServer.length > 0
            ? fromServer
            : [
                { code: 'story_relationship', label: '연애 이야기' },
                { code: 'announcement', label: '공지' },
            ];
        if (extraCategoryOption && !base.find((b) => b.code === extraCategoryOption.code)) {
            return [...base, extraCategoryOption];
        }
        return base;
    }, [serverCategories, extraCategoryOption]);
    const categoryLabel = useMemo(() => {
        const found = categoryOptions.find((c) => c.code === watchedCategoryCode);
        return found?.label ?? '';
    }, [categoryOptions, watchedCategoryCode]);
    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    useUnsavedGuard(isDirty || htmlDirty, isSubmitting);
    useEffect(() => {
        const bodyBytes = new Blob([watchedBody ?? '']).size;
        if (bodyBytes > LONGFORM_BODY_SOFT_LIMIT_BYTES && !warnedSoftLimit) {
            toast.warning('본문이 50KB를 초과합니다. 분량이 과도하게 길지 않은지 확인해주세요.');
            setWarnedSoftLimit(true);
        }
        else if (bodyBytes <= LONGFORM_BODY_SOFT_LIMIT_BYTES && warnedSoftLimit) {
            setWarnedSoftLimit(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [watchedBody]);
    const fetchBackgroundPresets = async () => {
        try {
            setPresetsLoading(true);
            const response = await AdminService.backgroundPresets.getActive();
            const presets = Array.isArray(response) ? response : (response?.data || []);
            setBackgroundPresets(presets);
            return presets;
        }
        catch {
            return [];
        }
        finally {
            setPresetsLoading(false);
        }
    };
    const init = async () => {
        try {
            setInitialLoading(true);
            if (isEdit && id) {
                const [detail, presets] = await Promise.all([
                    AdminService.cardNews.get(id),
                    fetchBackgroundPresets(),
                ]);
                setIsPublished(!!detail.publishedAt);
                setInitialNoticeState(detail.noticeHtmlState ?? undefined);
                setHtmlMode(!!detail.noticeHtmlState);
                const categoryCode = detail.category.code;
                if (!categoryOptions.find((o) => o.code === categoryCode)) {
                    setExtraCategoryOption({
                        code: categoryCode,
                        label: detail.category.displayName || categoryCode,
                    });
                }
                reset({
                    title: detail.title,
                    displayTitle: detail.displayTitle || '',
                    subtitle: detail.subtitle || '',
                    description: detail.description || '',
                    categoryCode,
                    hasReward: detail.hasReward || false,
                    body: detail.body || '',
                    pushTitle: detail.pushNotificationTitle || '',
                    pushMessage: detail.pushNotificationMessage || '',
                });
                if (detail.backgroundImage) {
                    const bg = detail.backgroundImage;
                    if (bg.type === 'PRESET' && bg.preset) {
                        setBackgroundType('PRESET');
                        setSelectedPresetId(bg.preset.id);
                    }
                    else if (bg.type === 'CUSTOM') {
                        setBackgroundType('CUSTOM');
                        setCustomBackgroundUrl(bg.customUrl || '');
                    }
                }
            }
            else {
                if (initialHtmlMode || new URLSearchParams(window.location.search).get('format') === 'html') {
                    setHtmlMode(true);
                    reset({ ...getValues(), categoryCode: 'announcement', hasReward: false });
                }
                const presets = await fetchBackgroundPresets();
                if (presets.length > 0)
                    setSelectedPresetId(presets[0].id);
            }
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '데이터를 불러오는데 실패했습니다.'));
        }
        finally {
            setInitialLoading(false);
        }
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
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '이미지 업로드에 실패했습니다.'));
        }
        finally {
            setUploadingBackground(false);
        }
    };
    const handlePresetEdit = (preset: BackgroundPreset) => {
        setEditingPreset(preset);
        setPresetEditModalOpen(true);
    };
    const handlePresetDelete = async (presetId: string) => {
        try {
            await AdminService.backgroundPresets.delete(presetId);
            if (selectedPresetId === presetId)
                setSelectedPresetId('');
            await fetchBackgroundPresets();
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '프리셋 삭제에 실패했습니다.'));
        }
    };
    const handleCancel = async () => {
        if (!isDirty && !htmlDirty) {
            router.push(htmlMode ? '/admin/content?tab=notice' : '/admin/content?tab=longform');
            return;
        }
        const ok = await confirmAction({
            title: '작성 취소',
            message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
        });
        if (ok) {
            router.push(htmlMode ? '/admin/content?tab=notice' : '/admin/content?tab=longform');
        }
    };
    const buildPayload = (data: LongformFormData): CreateCardNewsRequest => ({
        title: data.title.trim(),
        displayTitle: data.displayTitle?.trim() || null,
        subtitle: data.subtitle?.trim() || undefined,
        description: data.description.trim(),
        categoryCode: data.categoryCode,
        layoutMode: 'longform',
        hasReward: data.hasReward,
        body: data.body,
        backgroundImage: backgroundType === 'PRESET'
            ? { type: 'PRESET' as const, presetId: selectedPresetId }
            : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
        ...(data.pushTitle?.trim() ? { pushNotificationTitle: data.pushTitle.trim() } : {}),
        ...(data.pushMessage?.trim() ? { pushNotificationMessage: data.pushMessage.trim() } : {}),
    });
    const validateBackground = () => {
        if (backgroundType === 'PRESET' && !selectedPresetId) {
            toast.error('배경 프리셋을 선택해주세요.');
            return false;
        }
        if (backgroundType === 'CUSTOM' && !customBackgroundUrl) {
            toast.error('배경 이미지를 업로드해주세요.');
            return false;
        }
        return true;
    };
    const persist = async (data: LongformFormData): Promise<string | null> => {
        if (!validateBackground())
            return null;
        const payload = buildPayload(data);
        try {
            if (isEdit && id) {
                const { layoutMode: _layoutMode, ...updatePayload } = payload;
                await AdminService.cardNews.update(id, updatePayload);
                toast.success('롱폼 아티클이 수정되었습니다.');
                return id;
            }
            const created = await AdminService.cardNews.create(payload);
            toast.success('롱폼 아티클이 생성되었습니다.');
            return created.id;
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
            return null;
        }
    };
    const onSubmit = handleFormSubmit(async (data) => {
        const savedId = await persist(data);
        if (savedId) {
            router.push('/admin/content?tab=longform');
        }
    });
    const onSubmitAndPublish = handleFormSubmit(async (data) => {
        const savedId = await persist(data);
        if (!savedId)
            return;
        try {
            const values = getValues();
            const result = await AdminService.cardNews.publish(savedId, {
                ...(values.pushTitle?.trim() ? { pushNotificationTitle: values.pushTitle.trim() } : {}),
                ...(values.pushMessage?.trim()
                    ? { pushNotificationMessage: values.pushMessage.trim() }
                    : {}),
            });
            if (result.success) {
                toast.success(values.pushMessage?.trim()
                    ? `푸시 알림이 ${result.sentCount ?? 0}명에게 발송되었습니다.`
                    : '롱폼 아티클이 발행되었습니다.');
                router.push('/admin/content?tab=longform');
            }
            else {
                toast.error('발행에 실패했습니다. 다시 시도해주세요.');
            }
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '발행에 실패했습니다.'));
        }
    });
    const saveHtml = async (noticeHtmlInput: NoticeHtmlInput, publish: boolean): Promise<AdminCardNewsItem> => {
        const values = getValues();
        const parsed = longformFormSchema.safeParse({ ...values, body: noticeHtmlInput.html, hasReward: false });
        if (!parsed.success)
            throw new Error(parsed.error.issues[0]?.message || '기본 정보를 확인해주세요.');
        if (values.categoryCode !== 'announcement')
            throw new Error('HTML은 공지 카테고리에서만 지원합니다.');
        const banner = noticeBackground(backgroundType, selectedPresetId, customBackgroundUrl);
        const payload: CreateCardNewsRequest = {
            title: values.title.trim(), displayTitle: values.displayTitle?.trim() || null,
            subtitle: values.subtitle?.trim() || undefined, description: values.description.trim(),
            categoryCode: 'announcement', layoutMode: 'longform', hasReward: false, noticeHtmlInput,
            ...(banner ? { backgroundImage: banner } : {}),
            ...(values.pushTitle?.trim() ? { pushNotificationTitle: values.pushTitle.trim() } : {}),
            ...(values.pushMessage?.trim() ? { pushNotificationMessage: values.pushMessage.trim() } : {}),
        };
        const saved = htmlArticleId
            ? await AdminService.cardNews.update(htmlArticleId, payload)
            : await AdminService.cardNews.create(payload);
        setHtmlArticleId(saved.id);
        const detail = saved.noticeHtmlState ? saved : await AdminService.cardNews.get(saved.id);
        setInitialNoticeState(detail.noticeHtmlState ?? undefined);
        if (JSON.stringify(getValues()) === JSON.stringify(values))
            reset({ ...values, hasReward: false });
        toast.success('KR 안전본을 저장했습니다. JP 번역은 백그라운드에서 진행됩니다.');
        if (publish) {
            try {
                const result = await AdminService.cardNews.publish(saved.id, {
                    expectedRevision: detail.noticeHtmlState?.revision,
                    ...(values.pushTitle?.trim() ? { pushNotificationTitle: values.pushTitle.trim() } : {}),
                    ...(values.pushMessage?.trim() ? { pushNotificationMessage: values.pushMessage.trim() } : {}),
                });
                if (!result.success)
                    throw new Error('저장했지만 발행에 실패했습니다. 리비전을 확인하고 다시 시도해주세요.');
                setIsPublished(true);
                toast.success('KR 공지를 발행했습니다. JP는 안전본이 준비되면 자동 반영됩니다.');
            }
            catch (error) {
                toast.error(getApiErrorMessage(error, 'KR 저장은 완료했지만 발행에 실패했습니다. 최신 리비전으로 다시 시도해주세요.'));
            }
        }
        return detail;
    };
    const restoreHtmlMetadata = (detail: AdminCardNewsItem) => {
        reset({ ...getValues(), title: detail.title, displayTitle: detail.displayTitle || '', subtitle: detail.subtitle || '', description: detail.description || '', hasReward: false });
        setIsPublished(!!detail.publishedAt);
    };
    if (initialLoading)
        return <div className="flex min-h-[60vh] items-center justify-center gap-3"><Spinner></Spinner><p>불러오는 중...</p></div>;
    return (<main className="mx-auto max-w-[1400px] space-y-6 p-6">
      <header className="flex items-center gap-4">
        <Button variant="secondary" onPress={handleCancel}><ArrowLeft size={16}></ArrowLeft>목록으로</Button>
        <h1 className="text-2xl font-bold">{htmlMode ? (isEdit ? 'HTML 공지 수정' : 'HTML 공지 작성') : (isEdit ? '롱폼 아티클 수정' : '새 롱폼 아티클 작성')}</h1>
      </header>
      {isEdit && isPublished && <p role="status" className="rounded-lg border p-3">이미 발행된 콘텐츠입니다. 수정한 내용이 즉시 반영됩니다.</p>}
      <div className="flex flex-col items-start gap-6 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-6">
          <section className="space-y-4 rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold">기본 정보</h2>
            {([
            ['title', '제목', 50, true],
            ['displayTitle', '앱 홈 노출 제목 (선택 사항)', 40, false],
            ['subtitle', '부제목 (선택 사항)', 100, false],
            ['description', '설명', 100, true],
        ] as const).map(([name, label, maxLength, required]) => <Controller key={name} name={name} control={control} render={({ field, fieldState }) => (<TextField isRequired={required} isInvalid={!!fieldState.error}>
                <Label>{label}</Label><Input {...field} value={field.value ?? ''} maxLength={maxLength}/>
                <Description>{(field.value ?? '').length}/{maxLength}자</Description><FieldError>{fieldState.error?.message}</FieldError>
              </TextField>)}></Controller>)}
            <Controller name="categoryCode" control={control} render={({ field, fieldState }) => (<div className="block space-y-2"><Select {...field} aria-label="카테고리" isDisabled={htmlMode} isRequired className="min-w-[120px]"><Label>카테고리</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={""} textValue={"\uCE74\uD14C\uACE0\uB9AC \uC120\uD0DD"}>카테고리 선택</ListBox.Item>{categoryOptions.map(c => <ListBox.Item key={c.code} id={c.code} textValue={String(c.label)}>{c.label}</ListBox.Item>)}
              </ListBox></Select.Popover></Select>{fieldState.error && <span role="alert">{fieldState.error.message}</span>}</div>)}></Controller>
            {watchedCategoryCode === 'announcement' && <Checkbox isSelected={htmlMode} isDisabled={!!initialNoticeState || !!htmlArticleId && htmlMode} onChange={checked => {
                setHtmlMode(checked);
                if (checked)
                    setValue('hasReward', false, { shouldDirty: true });
            }}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>HTML 공지 · JP 자동 번역</Checkbox.Content></Checkbox>}
            <hr></hr><h3 className="font-semibold">{htmlMode ? '배너 이미지' : 'Hero 이미지'}</h3>
            {htmlMode && <p className="text-sm text-gray-600">배너 이미지는 HTML 본문 안에는 표시되지 않습니다.</p>}
              <BackgroundSelector presets={backgroundPresets} selectedPresetId={selectedPresetId} customBackgroundUrl={customBackgroundUrl} backgroundType={backgroundType} loading={presetsLoading} uploadingBackground={uploadingBackground} onPresetSelect={handlePresetSelect} onPresetEdit={handlePresetEdit} onCustomUpload={handleBackgroundUpload} onCustomClear={() => setCustomBackgroundUrl('')} onBackgroundTypeChange={setBackgroundType} onAddPresetClick={() => setPresetUploadModalOpen(true)}></BackgroundSelector>
            {!htmlMode && <Controller name="hasReward" control={control} render={({ field }) => <Checkbox isSelected={field.value} onChange={field.onChange}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>구슬 보상 제공</Checkbox.Content></Checkbox>}></Controller>}
          </section>
          {htmlMode ? <HtmlNoticeEditor key={id || 'new-html-notice'} articleId={htmlArticleId} initialState={initialNoticeState} metadata={{ title: watchedTitle.trim(), displayTitle: watchedValues.displayTitle?.trim() || null, subtitle: watchedSubtitle?.trim() || undefined, description: watchedDescription.trim(), categoryCode: 'announcement', layoutMode: 'longform', hasReward: false }} metadataKey={JSON.stringify(watchedValues)} onSave={saveHtml} onRestored={restoreHtmlMetadata} onDirty={setHtmlDirty}></HtmlNoticeEditor> : <section className="space-y-4 rounded-xl border bg-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">본문</h2><p className="text-sm text-gray-600">예상 읽기 시간 {readTimeMinutes}분</p></div>
            <Controller name="body" control={control} render={({ field, fieldState }) => <div><MarkdownEditor value={field.value} onChange={field.onChange} minHeight={600}/>{fieldState.error && <p role="alert">{fieldState.error.message}</p>}</div>}></Controller>
          </section>}
          <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">푸시 알림 설정</h2>
            {(['pushTitle', 'pushMessage'] as const).map(name => <Controller key={name} name={name} control={control} render={({ field, fieldState }) => <TextField isInvalid={!!fieldState.error}><Label>{name === 'pushTitle' ? '푸시 알림 제목 (선택 사항)' : '푸시 알림 메시지 (선택 사항)'}</Label>{name === 'pushTitle' ? <Input {...field} value={field.value ?? ''} maxLength={50}/> : <TextArea {...field} value={field.value ?? ''} maxLength={100} rows={2}/>}<Description>{(field.value ?? '').length}/{name === 'pushTitle' ? 50 : 100}자</Description><FieldError>{fieldState.error?.message}</FieldError></TextField>}></Controller>)}
          </section>
          {!htmlMode && <div className="flex justify-end gap-3"><Button variant="secondary" onPress={handleCancel} isDisabled={isSubmitting}>취소</Button><Button onPress={() => void onSubmit()} isDisabled={isSubmitting}>{isSubmitting ? <Spinner size="sm"></Spinner> : <Save size={16}></Save>}{isSubmitting ? '저장 중...' : '저장'}</Button><Button onPress={() => void onSubmitAndPublish()} isDisabled={isSubmitting}><Send size={16}></Send>저장 후 발행</Button></div>}
        </div>
        {!htmlMode && <aside className="w-full shrink-0 space-y-4 lg:sticky lg:top-6 lg:w-[460px]"><LongformPreview title={watchedTitle} subtitle={watchedSubtitle} description={watchedDescription} categoryLabel={categoryLabel} heroImageUrl={previewBackgroundUrl} body={watchedBody} readTimeMinutes={readTimeMinutes}></LongformPreview>{isEdit && id && isPublished && <OgPreviewCard path={`/card-news/${id}`} webUrl={AdminService.seo.getWebPageUrl('card-news', id)}></OgPreviewCard>}</aside>}
      </div>
      <PresetUploadModal open={presetUploadModalOpen} onClose={() => setPresetUploadModalOpen(false)} onSuccess={fetchBackgroundPresets}></PresetUploadModal>
      <PresetEditModal open={presetEditModalOpen} preset={editingPreset} onClose={() => { setPresetEditModalOpen(false); setEditingPreset(null); }} onSuccess={fetchBackgroundPresets} onDelete={handlePresetDelete}></PresetEditModal>
    </main>);
}
