'use client';
import { Button, Modal, TextField, TextArea, Label } from '@heroui/react';
import { useState } from 'react';
import type { BulkCreateResult, CreateStyleReferenceRequest } from '@/app/services/admin';
interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (items: CreateStyleReferenceRequest[]) => Promise<BulkCreateResult>;
    isLoading: boolean;
}
export function StyleReferenceBulkDialog({ open, onClose, onSubmit, isLoading }: Props) {
    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState<string | null>(null);
    const [result, setResult] = useState<BulkCreateResult | null>(null);
    const handleClose = () => {
        setJsonText('');
        setParseError(null);
        setResult(null);
        onClose();
    };
    const handleSubmit = async () => {
        setParseError(null);
        let items: CreateStyleReferenceRequest[];
        try {
            const parsed = JSON.parse(jsonText);
            items = Array.isArray(parsed) ? parsed : parsed.items;
            if (!Array.isArray(items))
                throw new Error('items 배열이 필요합니다.');
        }
        catch (e: any) {
            setParseError(`JSON 파싱 오류: ${e.message}`);
            return;
        }
        try {
            const res = await onSubmit(items);
            setResult(res);
        }
        catch (e: any) {
            setParseError(e?.response?.data?.message ?? '일괄 등록에 실패했습니다.');
        }
    };
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading>일괄 등록</Modal.Heading>
      <Modal.Body>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 8 }}>
          <p>
            JSON 배열을 붙여넣으세요. tags 미입력 항목은 AI가 자동 분석합니다.
          </p>

          <p style={{ backgroundColor: "#f3f4f6", padding: 8, borderRadius: 1, fontSize: 11 }}>
        {`[
  { "imageUrl": "https://...", "category": "VIBE", "gender": "FEMALE" },
  { "imageUrl": "https://...", "tags": ["chic"], "category": "FASHION", "gender": "MALE" }
]`}
          </p>

          <TextField className="mb-4"><Label>일괄 등록 JSON</Label><TextArea aria-label="일괄 등록 JSON" rows={8} value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder="JSON 붙여넣기..." disabled={!!result}></TextArea></TextField>

          {parseError && <aside role="alert" className="rounded-lg border p-3">{parseError}</aside>}

          {result && (<aside role="alert" className="rounded-lg border p-3">
              <p>
                ✓ 등록 완료: {result.created}개
                {result.analyzed > 0 && ` (AI 분석: ${result.analyzed}개)`}
              </p>
              {result.errors.length > 0 && (<p>
                  ✗ 실패: {result.errors.length}개
                </p>)}
            </aside>)}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={handleClose} variant="tertiary">{result ? '닫기' : '취소'}</Button>
        {!result && (<Button isDisabled={isLoading || !jsonText.trim()} variant="primary" onPress={() => void handleSubmit()}>
            {isLoading ? '등록 중...' : '일괄 등록'}
          </Button>)}
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
