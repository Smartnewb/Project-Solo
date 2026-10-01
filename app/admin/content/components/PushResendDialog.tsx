'use client';
import { Button, Modal, TextField, Label, Input, TextArea, Description } from '@heroui/react';
import { useEffect, useState } from 'react';
import { usePushResendNotice } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
interface Props {
    open: boolean;
    onClose: () => void;
    item: {
        id: string;
        title: string;
        pushTitle?: string | null;
        pushMessage?: string | null;
    } | null;
}
export function PushResendDialog({ open, onClose, item }: Props) {
    const toast = useToast();
    const mutation = usePushResendNotice();
    const [pushTitle, setPushTitle] = useState('');
    const [pushMessage, setPushMessage] = useState('');
    useEffect(() => {
        if (item) {
            setPushTitle(item.pushTitle || '');
            setPushMessage(item.pushMessage || '');
        }
    }, [item]);
    const handleSubmit = async () => {
        if (!item)
            return;
        if (!pushTitle.trim() || !pushMessage.trim()) {
            toast.error('푸시 제목과 메시지는 필수입니다.');
            return;
        }
        try {
            const res = await mutation.mutateAsync({
                id: item.id,
                data: { pushTitle: pushTitle.trim(), pushMessage: pushMessage.trim() },
            });
            toast.success(`푸시 재발송 완료. ${res.sentCount ?? 0}명에게 전송.`);
            onClose();
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '재발송에 실패했습니다.'));
        }
    };
    return (<Modal.Backdrop isOpen={open && !!item} onOpenChange={next => {
            if (!next)
                onClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading>푸시 재발송</Modal.Heading>
      <Modal.Body>
        {item && (<p style={{ marginBottom: 16 }}>
            &quot;{item.title}&quot; 공지의 푸시 알림을 다시 발송합니다.
          </p>)}
        <TextField className="mb-4"><Label>{"푸시 제목"}</Label><Input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} style={{ marginBottom: 16 }} {...{ maxLength: 50 }}></Input><Description>{`${pushTitle.length}/50자`}</Description></TextField>
        <TextField className="mb-4"><Label>{"푸시 메시지"}</Label><TextArea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} rows={2} {...{ maxLength: 100 }}></TextArea><Description>{`${pushMessage.length}/100자`}</Description></TextField>
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={onClose} isDisabled={mutation.isPending} variant="tertiary">
          취소
        </Button>
        <Button onPress={handleSubmit} isDisabled={mutation.isPending || !pushTitle.trim() || !pushMessage.trim()} variant="tertiary">
          {mutation.isPending ? '발송 중...' : '재발송'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
