'use client';
import { Button, Modal, TextField, Label, Input, TextArea, Description, Checkbox } from '@heroui/react';
import { useEffect, useState } from 'react';
import { usePublishCardNews, useUpdateSometimeArticle, usePublishNotice, usePublishVideo, } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';
import { cardNews } from '@/app/services/admin/content';
import { CONTENT_TYPE_LABELS, type ContentType } from '../constants';
export type PublishDialogType = ContentType;
interface Props {
    open: boolean;
    onClose: () => void;
    type: ContentType;
    item: {
        id: string;
        title: string;
    } | null;
    onPublished?: () => void;
}
export function PublishDialog({ open, onClose, type, item, onPublished }: Props) {
    const toast = useToast();
    // 영상 발행은 push/reward 미발송(가드레일) → push UI 숨김
    const supportsPush = type !== 'article' && type !== 'video';
    const [pushEnabled, setPushEnabled] = useState(supportsPush);
    const [pushTitle, setPushTitle] = useState('');
    const [pushMessage, setPushMessage] = useState('');
    const [resolvingPublication, setResolvingPublication] = useState(false);
    const publishCardNews = usePublishCardNews();
    const updateArticle = useUpdateSometimeArticle();
    const publishNotice = usePublishNotice();
    const publishVideo = usePublishVideo();
    useEffect(() => {
        if (open) {
            setPushEnabled(supportsPush);
            setPushTitle('');
            setPushMessage('');
        }
    }, [open, item?.id, supportsPush]);
    const isPending = resolvingPublication ||
        publishCardNews.isPending ||
        updateArticle.isPending ||
        publishNotice.isPending ||
        publishVideo.isPending;
    const validate = () => {
        if (!supportsPush || !pushEnabled)
            return true;
        if (!pushMessage.trim()) {
            toast.error('푸시 알림 메시지를 입력해주세요.');
            return false;
        }
        return true;
    };
    const handleConfirm = async () => {
        if (!item)
            return;
        if (!validate())
            return;
        try {
            if (type === 'card-series' || type === 'longform') {
                setResolvingPublication(true);
                const current = await cardNews.get(item.id);
                if (current.noticeHtmlState && !pushEnabled) {
                    toast.error('HTML 공지는 현재 푸시 알림과 함께 발행됩니다. 푸시 알림을 켜주세요.');
                    return;
                }
                const result = await publishCardNews.mutateAsync({
                    id: item.id,
                    data: {
                        ...(current.noticeHtmlState ? { expectedRevision: current.noticeHtmlState.revision } : {}),
                        ...(pushEnabled && pushTitle.trim()
                            ? { pushNotificationTitle: pushTitle.trim() }
                            : {}),
                        ...(pushEnabled && pushMessage.trim()
                            ? { pushNotificationMessage: pushMessage.trim() }
                            : {}),
                    },
                });
                const successLabel = type === 'longform' ? '롱폼 아티클' : '카드시리즈';
                if (result.success) {
                    toast.success(current.noticeHtmlState
                        ? result.message || '공지가 발행되었습니다. 알림은 준비 후 발송됩니다.'
                        : pushEnabled
                            ? `푸시 알림이 ${result.sentCount ?? 0}명에게 발송되었습니다.`
                            : `${successLabel}이(가) 발행되었습니다.`);
                }
                else {
                    toast.error('발행에 실패했습니다. 다시 시도해주세요.');
                    return;
                }
            }
            else if (type === 'article') {
                await updateArticle.mutateAsync({
                    id: item.id,
                    data: {
                        status: 'published',
                        publishedAt: new Date().toISOString(),
                    },
                });
                toast.success('아티클이 발행되었습니다.');
            }
            else if (type === 'video') {
                const result = await publishVideo.mutateAsync(item.id);
                if (result.success) {
                    toast.success('영상이 발행되었습니다.');
                }
                else {
                    toast.error('발행에 실패했습니다.');
                    return;
                }
            }
            else if (type === 'notice') {
                const result = await publishNotice.mutateAsync({
                    id: item.id,
                    data: {
                        pushEnabled,
                        ...(pushEnabled && pushTitle.trim() ? { pushTitle: pushTitle.trim() } : {}),
                        ...(pushEnabled && pushMessage.trim() ? { pushMessage: pushMessage.trim() } : {}),
                    },
                });
                if (result.success) {
                    toast.success(pushEnabled
                        ? `공지가 발행되고 ${result.sentCount ?? 0}명에게 푸시 발송되었습니다.`
                        : '공지가 발행되었습니다.');
                }
                else {
                    toast.error('발행에 실패했습니다.');
                    return;
                }
            }
            onPublished?.();
            onClose();
        }
        catch (err: unknown) {
            toast.error(getApiErrorMessage(err, '발행에 실패했습니다.'));
        }
        finally {
            setResolvingPublication(false);
        }
    };
    const typeLabel = CONTENT_TYPE_LABELS[type];
    return (<Modal.Backdrop isOpen={open && !!item} onOpenChange={next => {
            if (!next)
                onClose();
        }}><Modal.Container size="lg"><Modal.Dialog>
      <Modal.Heading>{typeLabel} 발행</Modal.Heading>
      <Modal.Body>
        <p style={{ marginBottom: 16 }}>
          이 {typeLabel}을(를) 발행하시겠습니까?
        </p>
        {item && (<div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
            <p>
              <strong>제목:</strong> {item.title}
            </p>
          </div>)}

        {!supportsPush ? (<p style={{ marginTop: 8 }}>
            {typeLabel}은(는) 발행 시 푸시 알림이 발송되지 않습니다.
          </p>) : (<>
            <Checkbox isSelected={pushEnabled} onChange={checked => setPushEnabled(checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"푸시 알림 함께 발송"}</Checkbox.Content></Checkbox>

            {pushEnabled && (<>
                <TextField className="mb-4"><Label>{"푸시 알림 제목 (선택)"}</Label><Input value={pushTitle} onChange={(e) => setPushTitle(e.target.value)} style={{ marginBottom: 16 }} {...{ maxLength: 50 }}></Input><Description>{`${pushTitle.length}/50자 | 비워두면 콘텐츠 제목이 사용됩니다.`}</Description></TextField>
                <TextField isInvalid={!pushMessage.trim()} className="mb-4"><Label>{"푸시 알림 메시지"}</Label><TextArea value={pushMessage} onChange={(e) => setPushMessage(e.target.value)} rows={2} {...{ maxLength: 100 }}></TextArea><Description>{`${pushMessage.length}/100자 | 필수 항목입니다.`}</Description></TextField>
              </>)}
          </>)}
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={onClose} isDisabled={isPending} variant="tertiary">
          취소
        </Button>
        <Button onPress={handleConfirm} isDisabled={isPending || (supportsPush && pushEnabled && !pushMessage.trim())} variant="tertiary">
          {isPending ? '발행 중...' : '발행'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
