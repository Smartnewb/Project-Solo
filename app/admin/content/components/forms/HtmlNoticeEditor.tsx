'use client';
import { Button, TextArea } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import AdminService from '@/app/services/admin';
import type { AdminCardNewsItem, NoticeHtmlInput, NoticeHtmlPreviewRequest, NoticeHtmlState } from '@/types/admin';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';
import { getApiErrorMessage } from '@/app/utils/errors';
type Props = {
    articleId?: string;
    initialState?: NoticeHtmlState;
    metadata: Omit<NoticeHtmlPreviewRequest, 'noticeHtmlInput'>;
    metadataKey: string;
    onSave: (input: NoticeHtmlInput, publish: boolean) => Promise<AdminCardNewsItem>;
    onRestored: (detail: AdminCardNewsItem) => void;
    onDirty: (dirty: boolean) => void;
};
export function HtmlNoticeEditor({ articleId, initialState, metadata, metadataKey, onSave, onRestored, onDirty }: Props) {
    const toast = useToast();
    const confirm = useConfirm();
    const [html, setHtml] = useState(initialState?.variants.kr.editableHtml ?? initialState?.variants.kr.safeHtml ?? '');
    const [legacyInitialHtml, setLegacyInitialHtml] = useState(initialState?.variants.kr.safeHtml ?? '');
    const [legacyLinkUrls, setLegacyLinkUrls] = useState(initialState?.variants.kr.editableHtml ? [] : (initialState?.variants.kr.links ?? []).map((link) => link.url));
    const legacyWarning = '이전 공지의 링크를 보존하려면 원본 HTML 파일을 다시 올려주세요.';
    const [css, setCss] = useState(initialState?.variants.kr.safeCss ?? '');
    const [serverState, setServerState] = useState(initialState);
    const [baseRevision, setBaseRevision] = useState(initialState?.revision ?? 0);
    const [busy, setBusy] = useState(false);
    const [pollFailed, setPollFailed] = useState(false);
    const sourceKey = JSON.stringify({ html, css });
    const inputKey = JSON.stringify({ html, css, metadata, metadataKey });
    const currentKey = useRef(inputKey);
    const htmlFileRef = useRef<HTMLInputElement>(null);
    const imageFileRef = useRef<HTMLInputElement>(null);
    currentKey.current = inputKey;
    const [savedInput, setSavedInput] = useState(JSON.stringify({ html, css }));
    const [preview, setPreview] = useState<{
        key: string;
        digest: string;
        document: string;
    } | null>(null);
    useEffect(() => { setPreview((previous) => previous?.key === inputKey ? previous : null); }, [inputKey]);
    const [copyDraft, setCopyDraft] = useState<{
        sourceKey: string;
        html: string;
        css: string;
        segments: Array<{
            id: string;
            text: string;
        }>;
        edits: Array<{
            id: string;
            text: string;
        }>;
    } | null>(null);
    const currentCopy = copyDraft?.sourceKey === sourceKey ? copyDraft : null;
    const [copyNeedsValidation, setCopyNeedsValidation] = useState(false);
    const copyDirty = !!currentCopy && (copyNeedsValidation || JSON.stringify(currentCopy.segments) !== JSON.stringify(currentCopy.edits));
    useEffect(() => { setCopyDraft((previous) => previous?.sourceKey === sourceKey ? previous : null); }, [sourceKey]);
    const validated = preview?.key === inputKey ? preview : null;
    const mounted = useRef(true);
    useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
    useEffect(() => { onDirty(JSON.stringify({ html, css }) !== savedInput || copyDirty); }, [html, css, savedInput, copyDirty, onDirty]);
    useEffect(() => {
        if (!articleId || serverState?.translation.status !== 'pending')
            return;
        let active = true;
        let fetching = false;
        const poll = async () => {
            if (fetching || document.hidden)
                return;
            fetching = true;
            try {
                const latest = await AdminService.cardNews.get(articleId);
                if (active) {
                    setServerState(latest.noticeHtmlState ?? undefined);
                    setPollFailed(false);
                }
            }
            catch {
                if (active)
                    setPollFailed(true);
            }
            finally {
                fetching = false;
            }
        };
        const interval = setInterval(() => void poll(), 5000);
        const resume = () => { void poll(); };
        window.addEventListener('focus', resume);
        document.addEventListener('visibilitychange', resume);
        return () => { active = false; clearInterval(interval); window.removeEventListener('focus', resume); document.removeEventListener('visibilitychange', resume); };
    }, [articleId, serverState?.translation.status]);
    // Returns the fresh digest so save can validate inline; null when blocked or failed.
    const validate = async (applyText = copyDirty): Promise<string | null> => {
        if (busy)
            return null;
        const key = inputKey;
        const textDraft = applyText ? currentCopy : null;
        if (applyText && (!textDraft || !textDraft.edits.every((segment) => segment.text.trim()))) {
            toast.error('문구를 비울 수 없습니다. 삭제가 필요하면 HTML을 수정한 뒤 검증해주세요.');
            return null;
        }
        const requestHtml = textDraft?.html ?? html;
        const requestCss = textDraft?.css ?? css;
        if (legacyLinkUrls.length && requestHtml === legacyInitialHtml) {
            toast.error(legacyWarning);
            return null;
        }
        if (new Blob([requestHtml]).size > 256 * 1024 || new Blob([requestCss]).size > 12 * 1024) {
            toast.error('HTML 256KB, CSS 12KB 이하로 입력해주세요.');
            return null;
        }
        setBusy(true);
        setPreview(null);
        try {
            const result = await AdminService.cardNews.previewHtml({
                ...metadata, noticeHtmlInput: { html: requestHtml, css: requestCss },
                ...(textDraft ? { textEdits: textDraft.edits } : {}),
            });
            if (!mounted.current || currentKey.current !== key)
                return null;
            if (legacyLinkUrls.some((url) => !result.kr.links?.some((link) => link.url === url)))
                throw new Error(legacyWarning);
            if (textDraft && typeof result.editableHtml !== 'string')
                throw new Error('문구 반영 응답이 지원되지 않습니다. 서버 업데이트 후 다시 시도해주세요.');
            const nextHtml = textDraft ? result.editableHtml as string : html;
            const nextCss = textDraft ? result.editableCss ?? requestCss : css;
            const nextKey = JSON.stringify({ html: nextHtml, css: nextCss, metadata, metadataKey });
            if (textDraft) {
                setHtml(nextHtml);
                setCss(nextCss);
            }
            setPreview({ key: nextKey, digest: result.previewDigest, document: result.document });
            setCopyDraft(result.textSegments?.length ? {
                sourceKey: JSON.stringify({ html: nextHtml, css: nextCss }),
                html: nextHtml, css: nextCss,
                segments: result.textSegments, edits: result.textSegments.map((segment) => ({ ...segment })),
            } : null);
            setCopyNeedsValidation(false);
            return result.previewDigest;
        }
        catch (error) {
            toast.error(getApiErrorMessage(error, 'HTML 검증에 실패했습니다.'));
            return null;
        }
        finally {
            if (mounted.current)
                setBusy(false);
        }
    };
    // Metadata edits invalidate the digest, so save re-validates the current input itself instead of making the admin press 검증 again.
    const save = async (publish: boolean) => {
        if (busy || copyDirty || !html.trim())
            return;
        const key = inputKey;
        const digest = validated?.digest ?? await validate(false);
        if (!digest || !mounted.current || currentKey.current !== key)
            return;
        setBusy(true);
        try {
            const detail = await onSave({ html, css, previewDigest: digest, expectedRevision: baseRevision }, publish);
            if (!mounted.current)
                return;
            setServerState(detail.noticeHtmlState ?? undefined);
            setBaseRevision(detail.noticeHtmlState?.revision ?? baseRevision);
            if (detail.noticeHtmlState?.variants.kr.editableHtml)
                setLegacyLinkUrls([]);
            if (currentKey.current === key)
                setSavedInput(JSON.stringify({ html, css }));
        }
        catch (error) {
            toast.error(getApiErrorMessage(error, '저장에 실패했습니다.'));
        }
        finally {
            if (mounted.current)
                setBusy(false);
        }
    };
    const uploadHtml = async (file?: File) => {
        if (!file)
            return;
        if (!/\.html?$/i.test(file.name) || file.size > 256 * 1024) {
            toast.error('256KB 이하 HTML 파일을 선택해주세요.');
            return;
        }
        try {
            const text = await file.text();
            if (mounted.current)
                setHtml(text);
        }
        catch {
            toast.error('파일을 읽을 수 없습니다.');
        }
    };
    const uploadImage = async (file?: File) => {
        if (!file)
            return;
        setBusy(true);
        try {
            const result = await AdminService.cardNews.uploadHtmlImage(file);
            const url = new URL(result.url);
            if (url.protocol !== 'https:' || url.username || url.password)
                throw new Error('승인된 이미지 URL이 아닙니다.');
            if (mounted.current)
                setHtml((value) => `${value}\n<img src="${result.url.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}" alt="">`);
        }
        catch (error) {
            toast.error(getApiErrorMessage(error, '이미지 업로드에 실패했습니다.'));
        }
        finally {
            if (mounted.current)
                setBusy(false);
        }
    };
    const restore = async () => {
        if (!articleId || busy)
            return;
        const approved = await confirm({ title: '직전 안전본 복원', message: '현재 편집 중인 내용은 사라집니다. 직전 안전본을 복원할까요?' });
        if (!approved)
            return;
        setBusy(true);
        try {
            const detail = await AdminService.cardNews.restoreHtml(articleId, baseRevision);
            if (!mounted.current)
                return;
            const state = detail.noticeHtmlState;
            if (!state)
                throw new Error('복원된 안전본을 찾을 수 없습니다.');
            const source = state.variants.kr.editableHtml ?? state.variants.kr.safeHtml;
            setHtml(source);
            setCss(state.variants.kr.safeCss);
            setLegacyInitialHtml(state.variants.kr.safeHtml);
            setLegacyLinkUrls(state.variants.kr.editableHtml ? [] : (state.variants.kr.links ?? []).map((link) => link.url));
            setSavedInput(JSON.stringify({ html: source, css: state.variants.kr.safeCss }));
            setServerState(state);
            setBaseRevision(state.revision);
            setPreview(null);
            setCopyDraft(null);
            setCopyNeedsValidation(false);
            onRestored(detail);
            toast.success('직전 안전본을 복원했습니다.');
        }
        catch (error) {
            toast.error(getApiErrorMessage(error, '복원에 실패했습니다.'));
        }
        finally {
            if (mounted.current)
                setBusy(false);
        }
    };
    const status = serverState?.translation.status;
    const statusLabel = status === 'pending' ? 'JP 생성 대기·처리 중' : status === 'done' ? (serverState?.variants.jp && serverState.variants.jp.revision === serverState.revision ? 'JP 게시본 준비 완료' : 'JP 게시본 확인 필요') : status === 'failed' ? (serverState?.variants.jp ? 'JP 번역 실패 · 기존 게시본 유지' : 'JP 번역 실패 · JP 게시본 없음') : '저장 후 JP 번역이 자동으로 시작됩니다';
    return <section aria-label="HTML 공지 편집" className="space-y-4 rounded-lg border p-5">
    <p className="text-sm text-gray-600">KR HTML을 저장하면 GPT Luna가 JP를 비동기로 번역합니다. 업로드 화면에서 기다리지 않아도 됩니다. JavaScript·폼·외부 스타일은 지원하지 않습니다.</p>
    <p role="status">{statusLabel}{serverState ? ` · KR 리비전 ${serverState.revision} · ${serverState.variants.jp ? `JP 리비전 ${serverState.variants.jp.revision}` : 'JP 아직 없음'}` : ''}</p>
    {legacyLinkUrls.length > 0 && !validated && !currentCopy && <p role="alert">{legacyWarning}</p>}
    {pollFailed && <p role="status">번역 상태를 확인하지 못했습니다. 다음 조회에서 다시 확인합니다.</p>}
    {serverState && serverState.revision !== baseRevision && <p role="alert">다른 수정본이 있습니다. 저장 시 충돌을 확인합니다. 작성 중인 내용은 유지됩니다.</p>}
    <div className="block text-sm"><Button variant="secondary" isDisabled={busy} onPress={() => htmlFileRef.current?.click()}>HTML 파일 선택</Button><input ref={htmlFileRef} hidden aria-label="HTML 파일 선택" type="file" accept=".html,.htm,text/html" disabled={busy} onChange={(event) => { void uploadHtml(event.target.files?.[0]); event.target.value = ''; }} className="hidden"></input></div>
    <label className="block text-sm">HTML<TextArea aria-label="HTML" rows={12} value={html} onChange={(event) => setHtml(event.target.value)} disabled={busy} className="mt-2 w-full rounded-md border p-3 font-mono"></TextArea></label>
    <p className="text-sm text-gray-600">HTML {new Blob([html]).size} / 262144 bytes · CSS {new Blob([css]).size} / 12288 bytes</p>
    <label className="block text-sm">CSS<TextArea aria-label="CSS" rows={6} value={css} onChange={(event) => setCss(event.target.value)} disabled={busy} className="mt-2 w-full rounded-md border p-3 font-mono"></TextArea></label>
    <div className="block text-sm"><Button variant="secondary" isDisabled={busy} onPress={() => imageFileRef.current?.click()}>승인 이미지 업로드</Button><input ref={imageFileRef} hidden aria-label="승인 이미지 업로드" type="file" accept="image/png,image/jpeg" disabled={busy} onChange={(event) => { void uploadImage(event.target.files?.[0]); event.target.value = ''; }} className="hidden"></input></div>
    <p className="text-sm text-gray-600">이미지 업로드 후 추가된 img의 alt에 설명을 입력해주세요. 이미지 안의 한국어는 자동 번역되지 않습니다.</p>
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="secondary" isDisabled={busy || !html.trim()} onPress={() => void validate()}>{busy ? '처리 중…' : '검증 및 미리보기'}</Button>
      <Button type="button" variant="secondary" isDisabled={busy || !html.trim() || copyDirty} onPress={() => void save(false)}>저장</Button>
      <Button type="button" variant="secondary" isDisabled={busy || !html.trim() || copyDirty} onPress={() => void save(true)}>저장 후 발행</Button>
      {serverState?.previous && <Button type="button" variant="secondary" isDisabled={busy} onPress={() => void restore()}>직전 안전본 복원</Button>}
    </div>
    <p className="text-sm text-gray-600">모바일 폭 미리보기 (최대 390px) · 서버 검증 결과 기준</p>
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
      <div className="w-full max-w-[390px]">
        {validated ? <iframe title="검증된 KR 공지 미리보기" sandbox="" srcDoc={validated.document} referrerPolicy="no-referrer" className="h-[540px] w-full border"></iframe> : <p className="text-sm text-gray-600">입력 원본은 실행하지 않습니다. 변경 후에는 서버 검증을 다시 진행해주세요.</p>}
      </div>
      {currentCopy && <section aria-label="미리보기 문구 수정" className="min-w-0 flex-1 space-y-3 rounded-md border p-4">
        <h3 className="font-semibold">문구 수정</h3>
        <p className="text-sm text-gray-600">옆 문구를 수정한 뒤 반영하면 서버가 텍스트만 안전하게 교체합니다. HTML 구조·색·이미지는 유지하며, 이미지 설명도 수정할 수 있습니다.</p>
        {currentCopy.edits.map((segment, index) => <label key={segment.id} className="block text-sm">
          {segment.id.startsWith('alt-') ? '이미지 설명' : '문구'} {index + 1}
          <TextArea aria-label={`${segment.id.startsWith('alt-') ? '이미지 설명' : '문구'} ${index + 1}`} value={segment.text} rows={3} disabled={busy} className="mt-1 w-full rounded-md border p-2" onChange={(event) => {
                    const text = event.target.value;
                    setCopyNeedsValidation(true);
                    setCopyDraft((previous) => previous ? { ...previous, edits: previous.edits.map((item) => item.id === segment.id ? { ...item, text } : item) } : null);
                }}></TextArea>
        </label>)}
        {copyDirty && <p role="status" className="text-sm text-gray-600">수정한 문구는 아직 미리보기와 저장본에 반영되지 않았습니다.</p>}
        <Button type="button" variant="secondary" isDisabled={busy || !copyDirty} onPress={() => void validate(true)}>문구 반영 및 재검증</Button>
      </section>}
    </div>
  </section>;
}
