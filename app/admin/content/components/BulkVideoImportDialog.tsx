'use client';
import { Button, Spinner, Chip, Modal, TextField, Label, TextArea, Description, Select, ListBox } from '@heroui/react';
import { CircleCheck as CheckCircleIcon, CircleAlert as ErrorIcon, Copy as ContentCopyIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { BulkCreateVideoResponse, TargetGender, VideoStatus } from '@/types/admin';
import { useBulkCreateVideos } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { TARGET_GENDER_OPTIONS } from '@/app/admin/content/constants';
interface Props {
    open: boolean;
    onClose: () => void;
}
function parseUrls(text: string): string[] {
    return text
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
}
export function BulkVideoImportDialog({ open, onClose }: Props) {
    const toast = useToast();
    const bulkCreate = useBulkCreateVideos();
    const [urlsText, setUrlsText] = useState('');
    const [status, setStatus] = useState<VideoStatus>('published');
    const [targetGender, setTargetGender] = useState<TargetGender>('ALL');
    const [result, setResult] = useState<BulkCreateVideoResponse | null>(null);
    // 닫힌 뒤에 도착한 응답이 다음 열림에 섞이지 않도록 요청 세대를 기록한다.
    const requestIdRef = useRef(0);
    useEffect(() => {
        if (open) {
            setUrlsText('');
            setStatus('published');
            setTargetGender('ALL');
            setResult(null);
        }
    }, [open]);
    const urls = parseUrls(urlsText);
    const urlCount = urls.length;
    const handleSubmit = async () => {
        if (urlCount === 0) {
            toast.error('URL을 입력해주세요.');
            return;
        }
        const requestId = ++requestIdRef.current;
        try {
            const res = await bulkCreate.mutateAsync({ urls, status, targetGender });
            if (requestId !== requestIdRef.current)
                return;
            setResult(res);
        }
        catch (err: unknown) {
            if (requestId !== requestIdRef.current)
                return;
            toast.error(getApiErrorMessage(err, '일괄 등록에 실패했습니다.'));
        }
    };
    const handleClose = () => {
        requestIdRef.current += 1;
        setUrlsText('');
        setStatus('published');
        setTargetGender('ALL');
        setResult(null);
        onClose();
    };
    return (<Modal.Backdrop isOpen={open} isDismissable={!bulkCreate.isPending} isKeyboardDismissDisabled={bulkCreate.isPending} onOpenChange={next => {
            if (!next && !bulkCreate.isPending)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading>영상 일괄 추가</Modal.Heading>
      <Modal.Body>
        {!result ? (<div style={{ marginTop: 8 }} className="flex flex-wrap gap-4">
            <p>
              YouTube Shorts URL을 한 줄에 하나씩 입력하세요. 중복 영상은 자동으로 제외됩니다.
            </p>
            <TextField className="mb-4" aria-label="영상 URL 목록"><TextArea aria-label="영상 URL 목록" rows={10} placeholder={'https://youtube.com/shorts/mZz70McqsSI\nhttps://youtube.com/shorts/4wQvtfBLV60\n...'} value={urlsText} onChange={(e) => setUrlsText(e.target.value)} {...{ style: { fontFamily: 'monospace', fontSize: 12 } }}></TextArea></TextField>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="block"><Select aria-label="등록 상태" value={status} onChange={(key) => {
                const value = String(key ?? "");
                setStatus(value as VideoStatus);
            }} className="min-w-[120px]"><Label>등록 상태</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox><ListBox.Item id={"published"} textValue={"\uBC1C\uD589"}>발행</ListBox.Item><ListBox.Item id={"draft"} textValue={"\uCD08\uC548"}>초안</ListBox.Item></ListBox></Select.Popover></Select></div>
              <div className="block"><Select aria-label="노출 대상" value={targetGender} onChange={(key) => {
                const value = String(key ?? "");
                setTargetGender(value as TargetGender);
            }} className="min-w-[120px]"><Label>노출 대상</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>{TARGET_GENDER_OPTIONS.map(opt => <ListBox.Item key={opt.value} id={opt.value} textValue={String(opt.label)}>{opt.label}</ListBox.Item>)}</ListBox></Select.Popover></Select></div>
              <p>
                {urlCount > 0 ? `${urlCount}개 URL 감지됨` : 'URL 미입력'}
              </p>
            </div>
          </div>) : (<div style={{ marginTop: 8 }} className="flex flex-wrap gap-4">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Chip size="sm">{`성공 ${result.success.length}개`}</Chip>
              <Chip size="sm">{`중복 ${result.duplicates.length}개`}</Chip>
              <Chip size="sm">{`실패 ${result.failed.length}개`}</Chip>
            </div>

            {result.success.length > 0 && (<div>
                <p style={{ marginBottom: 4 }}>
                  등록 성공 ({result.success.length}개)
                </p>
                {result.success.map((item) => (<p key={item.videoId}>
                    ✓ {item.title || item.videoId}
                  </p>))}
              </div>)}

            {result.duplicates.length > 0 && (<>
                <hr></hr>
                <div>
                  <p style={{ marginBottom: 4 }}>
                    중복 스킵 ({result.duplicates.length}개)
                  </p>
                  {result.duplicates.map((item) => (<p key={item.videoId}>
                      ⊘ {item.videoId}
                    </p>))}
                </div>
              </>)}

            {result.failed.length > 0 && (<>
                <hr></hr>
                <div>
                  <p style={{ marginBottom: 4 }}>
                    실패 ({result.failed.length}개)
                  </p>
                  {result.failed.map((item, i) => (<aside key={i} role="alert" className="rounded-lg border p-3" style={{ paddingBlock: 0, marginBottom: 4 }}>
                      <p>
                        {item.url} — {item.error}
                      </p>
                    </aside>))}
                </div>
              </>)}
          </div>)}
      </Modal.Body>

      <Modal.Footer>
        <Button onPress={handleClose} isDisabled={bulkCreate.isPending} variant="tertiary">
          {result ? '닫기' : '취소'}
        </Button>
        {!result && (<Button onPress={handleSubmit} isDisabled={bulkCreate.isPending || urlCount === 0} variant="primary">{bulkCreate.isPending ? <Spinner size="sm"></Spinner> : undefined}
            {bulkCreate.isPending ? `처리 중...` : `${urlCount}개 추가`}
          </Button>)}
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
