'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description, FieldError, Checkbox, Select, ListBox } from '@heroui/react';
import { useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { LongformForm } from './LongformForm';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft } from 'lucide-react';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { useUnsavedGuard } from '@/app/admin/hooks/use-unsaved-guard';
import { noticeFormSchema, type NoticeFormData, } from '@/app/admin/hooks/forms/schemas/content.schema';
import { useCreateNotice, useUpdateNotice, useNoticeDetail, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import type { CreateNoticeRequest, UpdateNoticeRequest } from '@/types/admin';
interface Props {
    mode: 'create' | 'edit';
    id?: string;
}
export function NoticeForm({ mode, id }: Props) {
    const router = useRouter();
    const toast = useToast();
    const confirmAction = useConfirm();
    const isEdit = mode === 'edit';
    const [htmlMode, setHtmlMode] = useState(false);
    const { control, watch, reset, handleFormSubmit, formState: { isSubmitting, isDirty }, } = useAdminForm<NoticeFormData>({
        schema: noticeFormSchema,
        defaultValues: {
            title: '',
            subtitle: '',
            categoryCode: 'notice',
            content: '',
            priority: 'normal',
            expiresAt: null,
            url: '',
            hasReward: false,
            pushEnabled: false,
            pushTitle: '',
            pushMessage: '',
        },
    });
    useUnsavedGuard(isDirty, isSubmitting);
    const pushEnabled = watch('pushEnabled');
    const createMutation = useCreateNotice();
    const updateMutation = useUpdateNotice();
    const { data: detail, isLoading: detailLoading } = useNoticeDetail(isEdit ? id || '' : '');
    useEffect(() => {
        if (isEdit && detail) {
            reset({
                title: detail.title,
                subtitle: detail.subtitle || '',
                categoryCode: 'notice',
                content: detail.content,
                priority: detail.priority,
                expiresAt: detail.expiresAt || null,
                url: detail.url || detail.linkUrl || '',
                hasReward: detail.hasReward,
                pushEnabled: detail.pushEnabled,
                pushTitle: detail.pushTitle || '',
                pushMessage: detail.pushMessage || '',
            });
        }
    }, [isEdit, detail, reset]);
    const handleCancel = async () => {
        const ok = await confirmAction({
            title: '작성 취소',
            message: '작성 중인 내용이 저장되지 않습니다. 취소하시겠습니까?',
        });
        if (ok) {
            router.push('/admin/content?tab=notice');
        }
    };
    const onSubmit = handleFormSubmit(async (data) => {
        try {
            if (isEdit && id) {
                const payload: UpdateNoticeRequest = {
                    title: data.title.trim(),
                    subtitle: data.subtitle?.trim() || undefined,
                    content: data.content,
                    priority: data.priority,
                    expiresAt: data.expiresAt || null,
                    linkUrl: data.url?.trim() || null,
                    hasReward: data.hasReward,
                    pushEnabled: data.pushEnabled,
                    pushTitle: data.pushEnabled ? data.pushTitle?.trim() || null : null,
                    pushMessage: data.pushEnabled ? data.pushMessage?.trim() || null : null,
                };
                await updateMutation.mutateAsync({ id, data: payload });
                toast.success('공지가 수정되었습니다.');
            }
            else {
                const payload: CreateNoticeRequest = {
                    title: data.title.trim(),
                    subtitle: data.subtitle?.trim() || undefined,
                    categoryCode: 'notice',
                    content: data.content,
                    priority: data.priority,
                    expiresAt: data.expiresAt || null,
                    linkUrl: data.url?.trim() || null,
                    hasReward: data.hasReward,
                    pushEnabled: data.pushEnabled,
                    pushTitle: data.pushEnabled ? data.pushTitle?.trim() || null : null,
                    pushMessage: data.pushEnabled ? data.pushMessage?.trim() || null : null,
                };
                await createMutation.mutateAsync(payload);
                toast.success('공지가 생성되었습니다.');
            }
            router.push('/admin/content?tab=notice');
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '저장에 실패했습니다.'));
        }
    });
    if (htmlMode)
        return <LongformForm mode="create" initialHtmlMode></LongformForm>;
    if (isEdit && detailLoading)
        return <div className="flex min-h-[60vh] items-center justify-center"><Spinner></Spinner></div>;
    return <main className="mx-auto max-w-[900px] space-y-6 p-6">
    <header className="flex items-center gap-4"><Button variant="secondary" onPress={handleCancel}><ArrowLeft size={16}></ArrowLeft>목록으로</Button><h1 className="text-2xl font-bold">{isEdit ? '공지 수정' : '새 공지 작성'}</h1></header>
    {!isEdit && <section className="space-y-3 rounded-xl border p-4"><h2 className="font-semibold">공지 형식</h2><div className="flex gap-3"><Button variant="primary" isDisabled>일반 공지</Button><Button variant="secondary" onPress={async () => {
                if (!isDirty || await confirmAction({ title: 'HTML 공지로 전환', message: '입력한 일반 공지 내용을 버리고 HTML 편집기를 열까요?' }))
                    setHtmlMode(true);
            }}>HTML 공지 · JP 자동 번역</Button></div><p className="text-sm text-gray-600">HTML 파일 업로드·문구 편집·검증 미리보기와 KR/JP 게시본을 관리합니다. HTML 공지는 별도로 저장하며 긴급 배너·만료일·배너 외부 링크 설정을 사용하지 않습니다.</p></section>}
    {createMutation.isError && <p role="alert">저장에 실패했습니다. 다시 시도해주세요.</p>}
    <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">기본 정보</h2>
      {(['title', 'subtitle', 'content'] as const).map(name => <Controller key={name} name={name} control={control} render={({ field, fieldState }) => <TextField isRequired={name !== 'subtitle'} isInvalid={!!fieldState.error}><Label>{name === 'title' ? '제목' : name === 'subtitle' ? '부제목' : '본문'}</Label>{name === 'content' ? <TextArea {...field} value={field.value ?? ''} rows={8} maxLength={2000}/> : <Input {...field} value={field.value ?? ''} maxLength={name === 'title' ? 50 : 100}/>}<Description>{name === 'content' ? '일반 공지 본문을 입력해주세요.' : `${(field.value ?? '').length}/${name === 'title' ? 50 : 100}자`}</Description><FieldError>{fieldState.error?.message}</FieldError></TextField>}></Controller>)}
    </section>
    <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">게시 설정</h2>
      <Controller name="priority" control={control} render={({ field }) => <div className="block space-y-2"><Select {...field} aria-label="우선순위" className="min-w-[120px]"><Label>우선순위</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={"normal"} textValue={"\uC77C\uBC18"}>일반</ListBox.Item><ListBox.Item id={"high"} textValue={"\uAE34\uAE09"}>긴급</ListBox.Item></ListBox></Select.Popover></Select></div>}></Controller>
      <Controller name="expiresAt" control={control} render={({ field, fieldState }) => <TextField isInvalid={!!fieldState.error}><Label>만료 일시 (선택)</Label><Input type="datetime-local" value={field.value ? new Date(new Date(field.value).getTime() - new Date(field.value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''} onChange={e => field.onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}/><FieldError>{fieldState.error?.message}</FieldError></TextField>}></Controller>
      <Controller name="url" control={control} render={({ field, fieldState }) => <TextField isInvalid={!!fieldState.error}><Label>외부 링크 (선택)</Label><Input {...field} value={field.value ?? ''} placeholder="https://..."/><Description>유저 앱에서 배너 클릭 시 이동할 URL</Description><FieldError>{fieldState.error?.message}</FieldError></TextField>}></Controller>
    </section>
    <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">푸시 알림</h2>
      <Controller name="pushEnabled" control={control} render={({ field }) => <Checkbox isSelected={field.value} onChange={field.onChange}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>푸시 알림 발송</Checkbox.Content></Checkbox>}></Controller>
      {pushEnabled && (['pushTitle', 'pushMessage'] as const).map(name => <Controller key={name} name={name} control={control} render={({ field, fieldState }) => <TextField isRequired isInvalid={!!fieldState.error}><Label>{name === 'pushTitle' ? '푸시 제목' : '푸시 메시지'}</Label><Input {...field} value={field.value ?? ''} maxLength={name === 'pushTitle' ? 50 : 100}/><FieldError>{fieldState.error?.message}</FieldError></TextField>}></Controller>)}
    </section>
    <section className="space-y-4 rounded-xl border bg-white p-6"><h2 className="text-lg font-semibold">보상</h2><Controller name="hasReward" control={control} render={({ field }) => <Checkbox isSelected={field.value} onChange={field.onChange}><Checkbox.Content><Checkbox.Control><Checkbox.Indicator /></Checkbox.Control>리워드 지급</Checkbox.Content></Checkbox>}></Controller></section>
    <div className="flex justify-end gap-3"><Button variant="secondary" onPress={handleCancel} isDisabled={isSubmitting}>취소</Button><Button onPress={() => void onSubmit()} isDisabled={isSubmitting}>{isSubmitting ? <Spinner size="sm"></Spinner> : <Save size={16}></Save>}{isSubmitting ? '저장 중...' : '저장'}</Button></div>
  </main>;
}
