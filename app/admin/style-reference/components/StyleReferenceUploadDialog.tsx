'use client';
import { Button, Modal, TextField, Label, Input, Description, Select, ListBox } from '@heroui/react';
import { useState } from 'react';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import type { CreateStyleReferenceRequest } from '@/app/services/admin';
import { STYLE_KEYWORDS, CATEGORY_LABELS } from '../constants';
interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateStyleReferenceRequest) => Promise<void>;
    isLoading: boolean;
}
const EMPTY: CreateStyleReferenceRequest = {
    imageUrl: '',
    thumbnailUrl: undefined,
    tags: undefined,
    category: 'VIBE',
    gender: 'FEMALE',
    sortOrder: 0,
};
export function StyleReferenceUploadDialog({ open, onClose, onSubmit, isLoading }: Props) {
    const toast = useToast();
    const [form, setForm] = useState<CreateStyleReferenceRequest>(EMPTY);
    const [error, setError] = useState<string | null>(null);
    const handleClose = () => {
        setForm(EMPTY);
        setError(null);
        onClose();
    };
    const toggleTag = (code: string) => {
        const current = form.tags ?? [];
        const next = current.includes(code)
            ? current.filter((t) => t !== code)
            : [...current, code];
        setForm((f) => ({ ...f, tags: next.length > 0 ? next : undefined }));
    };
    const handleSubmit = async () => {
        if (!form.imageUrl.trim()) {
            setError('이미지 URL을 입력해주세요.');
            return;
        }
        setError(null);
        try {
            await onSubmit(form);
            handleClose();
        }
        catch (e: any) {
            const msg: string = e?.response?.data?.message ?? '등록에 실패했습니다.';
            // Vision AI 분석 실패는 toast + 인라인 에러 병행 노출
            if (msg.includes('분석') || msg.includes('analyze')) {
                toast.error('이미지 분석에 실패했습니다. 태그를 수동으로 입력해주세요.');
            }
            setError(msg);
        }
    };
    return (<Modal.Backdrop isOpen={open} isDismissable={!isLoading} isKeyboardDismissDisabled={isLoading} onOpenChange={next => {
            if (!next && !isLoading)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading>이미지 등록</Modal.Heading>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>

          <TextField className="mb-4"><Label>{"이미지 URL *"}</Label><Input value={form.imageUrl} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} placeholder="https://cdn.example.com/..."></Input></TextField>

          <TextField className="mb-4"><Label>{"썸네일 URL (선택)"}</Label><Input value={form.thumbnailUrl ?? ''} onChange={(e) => setForm((f) => ({ ...f, thumbnailUrl: e.target.value || undefined }))}></Input></TextField>

          <div>
            <p>
              성별 *
            </p>
            <div role="group" aria-label="성별" className="flex gap-2">{(['FEMALE', 'MALE'] as const).map(gender => <Button key={gender} aria-pressed={form.gender === gender} variant={form.gender === gender ? 'primary' : 'secondary'} onPress={() => setForm(f => ({ ...f, gender }))}>{gender === 'FEMALE' ? '여성' : '남성'}</Button>)}</div>
          </div>

          <div>
            <label>카테고리 *</label>
            <Select value={form.category} aria-label={"카테고리 *"} onChange={(key) => {
            const value = String(key ?? "");
            setForm((f) => ({ ...f, category: value as typeof f.category }));
        }} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (<ListBox.Item key={c} id={c} textValue={String(CATEGORY_LABELS[c])}>{CATEGORY_LABELS[c]}</ListBox.Item>))}
            </ListBox></Select.Popover></Select>
          </div>

          <div>
            <p>
              스타일 태그 (선택 — 미입력 시 AI 자동 분석)
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
              {STYLE_KEYWORDS.map((kw) => {
            const selected = (form.tags ?? []).includes(kw.code);
            return (<Button key={kw.code} aria-pressed={selected} variant={selected ? "primary" : "secondary"} onPress={() => toggleTag(kw.code)}>{`${kw.emoji} ${kw.nameKo}`}</Button>);
        })}
            </div>
            {!form.tags && (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 8, fontSize: 12 }}>
                태그 미선택 시 Gemini Vision AI가 자동으로 분석합니다.
              </aside>)}
          </div>

          <TextField className="mb-4"><Label>{"정렬 순서"}</Label><Input type="number" value={form.sortOrder ?? 0} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}></Input><Description>{"낮을수록 먼저 표시"}</Description></TextField>

          {error && <aside role="alert" className="rounded-lg border p-3">{error}</aside>}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={handleClose} isDisabled={isLoading} variant="tertiary">취소</Button>
        <Button isDisabled={isLoading} variant="primary" onPress={() => void handleSubmit()}>
          {isLoading ? '등록 중...' : '등록'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
