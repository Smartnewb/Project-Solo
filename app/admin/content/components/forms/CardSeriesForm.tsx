'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description, Select, ListBox, Checkbox } from '@heroui/react';
import { Plus as AddIcon, Save as SaveIcon, ArrowLeft as ArrowBackIcon } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { Controller, useFieldArray } from 'react-hook-form';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import CardEditor from '../card-series/CardEditor';
import PresetUploadModal from '../card-series/PresetUploadModal';
import PresetEditModal from '../card-series/PresetEditModal';
import BackgroundSelector from '../card-series/BackgroundSelector';
import CardNewsPreview from '../card-series/CardNewsPreview';
import CardNewsDetailPreview from '../card-series/CardNewsDetailPreview';
import type { BackgroundPreset } from '@/types/admin';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { useUnsavedGuard } from '@/app/admin/hooks/use-unsaved-guard';
import { useCardNewsCategories } from '@/app/admin/hooks';
import { cardNewsFormSchema, type CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { NEW_CATEGORY_OPTIONS } from '../../constants';
interface Props {
    mode: 'create' | 'edit';
    id?: string;
}
export function CardSeriesForm({ mode, id }: Props) {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const isEdit = mode === 'edit';
    const { control, watch, reset, handleFormSubmit, formState: { isSubmitting, isDirty } } = useAdminForm<CardNewsFormData>({
        schema: cardNewsFormSchema,
        defaultValues: {
            title: '',
            displayTitle: '',
            description: '',
            categoryCode: '',
            layoutMode: 'image_only',
            hasReward: false,
            pushTitle: '',
            pushMessage: '',
            sections: [{ order: 0, title: '', content: '', imageUrl: undefined }],
        },
    });
    useUnsavedGuard(isDirty, isSubmitting);
    const { data: serverCategories } = useCardNewsCategories();
    const categoryOptions = useMemo(() => {
        const fromServer = (serverCategories ?? []).map((c) => ({
            code: c.code,
            label: c.displayName,
        }));
        return fromServer.length > 0
            ? fromServer
            : NEW_CATEGORY_OPTIONS.map((c) => ({ code: c.code, label: c.label }));
    }, [serverCategories]);
    const { fields, append, remove, update, move } = useFieldArray({ control, name: 'sections' });
    const watchedTitle = watch('title');
    const watchedDescription = watch('description');
    const watchedHasReward = watch('hasReward');
    const watchedLayoutMode = watch('layoutMode');
    const watchedSections = watch('sections');
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
    const previewBackgroundUrl = useMemo(() => {
        if (backgroundType === 'CUSTOM' && customBackgroundUrl)
            return customBackgroundUrl;
        if (backgroundType === 'PRESET' && selectedPresetId) {
            const preset = backgroundPresets.find((p) => p.id === selectedPresetId);
            return preset?.imageUrl || preset?.thumbnailUrl;
        }
        return undefined;
    }, [backgroundType, customBackgroundUrl, selectedPresetId, backgroundPresets]);
    useEffect(() => {
        init();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
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
                const [cardNewsData, presets] = await Promise.all([
                    AdminService.cardNews.get(id),
                    fetchBackgroundPresets(),
                ]);
                setIsPublished(!!cardNewsData.publishedAt);
                reset({
                    title: cardNewsData.title,
                    displayTitle: cardNewsData.displayTitle || '',
                    description: cardNewsData.description || '',
                    categoryCode: cardNewsData.category.code,
                    layoutMode: cardNewsData.layoutMode === 'article' || cardNewsData.layoutMode === 'image_only'
                        ? cardNewsData.layoutMode
                        : 'image_only',
                    hasReward: cardNewsData.hasReward || false,
                    pushTitle: cardNewsData.pushNotificationTitle || '',
                    pushMessage: cardNewsData.pushNotificationMessage || '',
                    sections: cardNewsData.sections ?? [],
                });
                if (cardNewsData.backgroundImage) {
                    const bg = cardNewsData.backgroundImage;
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
    const handleAddCard = () => {
        if (isEdit && isPublished) {
            toast.error('발행된 카드시리즈의 섹션은 수정할 수 없습니다.');
            return;
        }
        if (fields.length >= 7) {
            toast.error('최대 7개의 카드까지만 추가할 수 있습니다.');
            return;
        }
        append({ order: fields.length, title: '', content: '', imageUrl: undefined });
    };
    const handleDuplicateCard = (index: number) => {
        if (isEdit && isPublished)
            return;
        if (fields.length >= 7)
            return;
        const source = watchedSections[index];
        append({
            order: fields.length,
            title: source.title,
            content: source.content,
            imageUrl: source.imageUrl,
        });
    };
    const handleDeleteSection = (index: number) => {
        if (isEdit && isPublished)
            return;
        if (fields.length <= 1)
            return;
        remove(index);
    };
    const handleDragEnd = (result: DropResult) => {
        if (!result.destination)
            return;
        if (isEdit && isPublished)
            return;
        const from = result.source.index;
        const to = result.destination.index;
        if (from !== to)
            move(from, to);
    };
    const handleCancel = async () => {
        const ok = await confirmAction({
            title: '작성 취소',
            message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
        });
        if (ok) {
            router.push('/admin/content?tab=card-series');
        }
    };
    const onSubmit = handleFormSubmit(async (data) => {
        if (backgroundType === 'PRESET' && !selectedPresetId) {
            toast.error('배경 프리셋을 선택해주세요.');
            return;
        }
        if (backgroundType === 'CUSTOM' && !customBackgroundUrl) {
            toast.error('배경 이미지를 업로드해주세요.');
            return;
        }
        const basePayload = {
            title: data.title.trim(),
            displayTitle: data.displayTitle?.trim() || null,
            description: data.description.trim(),
            layoutMode: data.layoutMode,
            backgroundImage: backgroundType === 'PRESET'
                ? { type: 'PRESET' as const, presetId: selectedPresetId }
                : { type: 'CUSTOM' as const, customUrl: customBackgroundUrl },
            hasReward: data.hasReward,
            ...(data.pushTitle?.trim() ? { pushNotificationTitle: data.pushTitle.trim() } : {}),
            ...(data.pushMessage?.trim() ? { pushNotificationMessage: data.pushMessage.trim() } : {}),
        };
        const sections = data.sections.map((section, i) => ({
            order: i,
            title: section.title.trim(),
            content: section.content,
            ...(section.imageUrl ? { imageUrl: section.imageUrl } : {}),
        }));
        try {
            if (isEdit && id) {
                const updatePayload: Record<string, unknown> = { ...basePayload };
                if (!isPublished)
                    updatePayload.sections = sections;
                await AdminService.cardNews.update(id, updatePayload);
                toast.success('카드시리즈가 수정되었습니다.');
            }
            else {
                await AdminService.cardNews.create({
                    ...basePayload,
                    categoryCode: data.categoryCode,
                    sections,
                });
                toast.success('카드시리즈가 생성되었습니다.');
            }
            router.push('/admin/content?tab=card-series');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
        }
    });
    if (initialLoading) {
        return (<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spinner size="sm"></Spinner>
        <p style={{ marginLeft: 16 }}>불러오는 중...</p>
      </div>);
    }
    return (<div style={{ padding: 24, maxWidth: 1400, marginInline: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button onPress={handleCancel} variant="tertiary" style={{ marginRight: 16 }}>{<ArrowBackIcon></ArrowBackIcon>}
          목록으로
        </Button>
        <h1 className="text-2xl font-bold">
          {isEdit ? '카드시리즈 수정' : '새 카드시리즈 작성'}
        </h1>
      </div>

      <div className="flex flex-col items-start gap-6 xl:flex-row">
        <div style={{ flex: 1, minWidth: 0 }}>
          <section style={{ padding: 24, marginBottom: 24 }} className="rounded-xl border bg-white p-4">
            <h2 style={{ marginBottom: 16 }} className="text-lg font-semibold">
              기본 정보
            </h2>

            <Controller name="title" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"제목"}</Label><Input {...field} required {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message ?? `${field.value.length}/50자`}</Description></TextField>)}></Controller>

            <Controller name="displayTitle" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"앱 홈 노출 제목 (선택 사항)"}</Label><Input {...field} value={field.value ?? ''} {...{ maxLength: 40 }}></Input><Description>{fieldState.error?.message ??
                `${(field.value ?? '').length}/40자 | 권장 16자, 비워두면 제목이 사용됩니다.`}</Description></TextField>)}></Controller>

            <Controller name="description" control={control} render={({ field, fieldState }) => (<TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"설명"}</Label><Input {...field} required {...{ maxLength: 100 }}></Input><Description>{fieldState.error?.message ?? `${field.value.length}/100자`}</Description></TextField>)}></Controller>

            {!isEdit && (<Controller name="categoryCode" control={control} render={({ field, fieldState }) => (<div style={{ marginBottom: 16 }}>
                    <label>카테고리</label>
                    <Select {...field} aria-label={"카테고리"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                      {categoryOptions.map((c) => (<ListBox.Item key={c.code} id={c.code} textValue={String(c.label)}>
                          {c.label}
                        </ListBox.Item>))}
                    </ListBox></Select.Popover></Select>
                    {fieldState.error && (<p style={{ marginTop: 4, marginLeft: 14 }}>
                        {fieldState.error.message}
                      </p>)}
                  </div>)}></Controller>)}

            <hr style={{ marginBlock: 24 }}></hr>

            <BackgroundSelector presets={backgroundPresets} selectedPresetId={selectedPresetId} customBackgroundUrl={customBackgroundUrl} backgroundType={backgroundType} loading={presetsLoading} uploadingBackground={uploadingBackground} onPresetSelect={handlePresetSelect} onPresetEdit={handlePresetEdit} onCustomUpload={handleBackgroundUpload} onCustomClear={() => setCustomBackgroundUrl('')} onBackgroundTypeChange={setBackgroundType} onAddPresetClick={() => setPresetUploadModalOpen(true)}></BackgroundSelector>

            <hr style={{ marginBlock: 24 }}></hr>

            <Controller name="hasReward" control={control} render={({ field }) => (<Checkbox isSelected={field.value} onChange={checked => (field.onChange)({ target: { checked: checked }, currentTarget: { checked: checked } } as never)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"구슬 보상 제공"}</Checkbox.Content></Checkbox>)}></Controller>

            <hr style={{ marginBlock: 24 }}></hr>

            <p style={{ marginBottom: 16 }}>
              푸시 알림 설정
            </p>

            <Controller name="pushTitle" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"푸시 알림 제목 (선택 사항)"}</Label><Input {...field} value={field.value ?? ''} {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message ??
                `${(field.value ?? '').length}/50자 | 비워두면 콘텐츠 제목이 사용됩니다.`}</Description></TextField>)}></Controller>

            <Controller name="pushMessage" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"푸시 알림 메시지 (선택 사항)"}</Label><TextArea {...field} value={field.value ?? ''} rows={2} {...{ maxLength: 100 }}></TextArea><Description>{fieldState.error?.message ?? `${(field.value ?? '').length}/100자`}</Description></TextField>)}></Controller>
          </section>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 className="text-lg font-semibold">카드 섹션 ({fields.length}/7)</h2>
              <Button onPress={handleAddCard} isDisabled={fields.length >= 7 || (isEdit && isPublished)} variant="secondary">{<AddIcon></AddIcon>}
                카드 추가
              </Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="card-sections">
                {(provided) => (<div ref={provided.innerRef} {...provided.droppableProps}>
                    {fields.map((field, index) => (<Draggable key={field.id} draggableId={field.id} index={index}>
                        {(draggableProvided) => (<div ref={draggableProvided.innerRef} {...draggableProvided.draggableProps}>
                            <CardEditor index={index} control={control} layoutMode={watchedLayoutMode} onDelete={() => handleDeleteSection(index)} canDelete={fields.length > 1 && !(isEdit && isPublished)} onImageUploaded={(i, url) => update(i, { ...watchedSections[i], imageUrl: url, order: i })} onImageRemoved={(i) => update(i, { ...watchedSections[i], imageUrl: undefined, order: i })} onDuplicate={handleDuplicateCard} dragHandleProps={draggableProvided.dragHandleProps ?? undefined}></CardEditor>
                          </div>)}
                      </Draggable>))}
                    {provided.placeholder}
                  </div>)}
              </Droppable>
            </DragDropContext>
          </div>

          <hr style={{ marginBlock: 24 }}></hr>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
            <Button onPress={handleCancel} isDisabled={isSubmitting} variant="secondary">
              취소
            </Button>
            <Button isDisabled={isSubmitting} variant="primary" onPress={() => void onSubmit()}>{isSubmitting ? <Spinner size="sm"></Spinner> : <SaveIcon></SaveIcon>}
              {isSubmitting ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>

        <aside className="w-full shrink-0 self-start xl:w-[390px]">
          <CardNewsPreview title={watchedTitle} description={watchedDescription} backgroundImageUrl={previewBackgroundUrl} hasReward={watchedHasReward}></CardNewsPreview>
          <CardNewsDetailPreview sections={watchedSections} layoutMode={watchedLayoutMode}></CardNewsDetailPreview>
        </aside>
      </div>

      <PresetUploadModal open={presetUploadModalOpen} onClose={() => setPresetUploadModalOpen(false)} onSuccess={fetchBackgroundPresets}></PresetUploadModal>

      <PresetEditModal open={presetEditModalOpen} preset={editingPreset} onClose={() => {
            setPresetEditModalOpen(false);
            setEditingPreset(null);
        }} onSuccess={fetchBackgroundPresets} onDelete={handlePresetDelete}></PresetEditModal>
    </div>);
}
