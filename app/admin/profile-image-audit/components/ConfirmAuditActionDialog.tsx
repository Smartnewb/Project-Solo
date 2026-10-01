'use client';
import { Button, Modal, TextField, Label, TextArea, Description, Select, ListBox } from '@heroui/react';
import { useEffect, useState } from 'react';
import { ACTION_LABELS, REJECT_REASON_OPTIONS, SIMPLE_REJECT_REASON } from '../constants';
import { getActionTone } from '../profile-image-audit-utils';
import type { AuditAction } from '../types';
const CUSTOM_REJECT_REASON_VALUE = '__custom__';
type Props = {
    readonly action: AuditAction | null;
    readonly selectedCount: number;
    readonly busy: boolean;
    readonly removesLastApprovedImage?: boolean;
    readonly onClose: () => void;
    readonly onConfirm: (rejectReason?: string) => void;
};
export function ConfirmAuditActionDialog({ action, selectedCount, busy, removesLastApprovedImage = false, onClose, onConfirm, }: Props) {
    const open = action != null;
    const tone = action ? getActionTone(action) : 'primary';
    const [selectedRejectReason, setSelectedRejectReason] = useState(SIMPLE_REJECT_REASON);
    const [rejectReason, setRejectReason] = useState(SIMPLE_REJECT_REASON);
    const normalizedRejectReason = rejectReason.trim();
    useEffect(() => {
        if (action === 'reject') {
            setSelectedRejectReason(SIMPLE_REJECT_REASON);
            setRejectReason(SIMPLE_REJECT_REASON);
        }
    }, [action]);
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                !busy && onClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}>
      <Modal.Heading>{action ? ACTION_LABELS[action] : '처리 확인'}</Modal.Heading>
      <Modal.Body>
        <p>
          선택한 프로필 이미지 {selectedCount.toLocaleString()}장을 처리합니다.
        </p>
        {action === 'reject' && (<div style={{ marginTop: 16 }}>
            <div>
              <Select value={selectedRejectReason} aria-label={"사진 변경 요청 사유"} onChange={(key) => {
                const value = String(key ?? "");
                const nextReason = value;
                setSelectedRejectReason(nextReason);
                if (nextReason !== CUSTOM_REJECT_REASON_VALUE) {
                    setRejectReason(nextReason);
                }
            }} className="min-w-[120px]"><Label>사진 변경 요청 사유</Label><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                {REJECT_REASON_OPTIONS.map((reason) => (<ListBox.Item key={reason} id={reason} textValue={String(reason)}>
                    {reason}
                  </ListBox.Item>))}
                <ListBox.Item id={CUSTOM_REJECT_REASON_VALUE} textValue={"\uC9C1\uC811 \uC791\uC131"}>직접 작성</ListBox.Item>
              </ListBox></Select.Popover></Select>
            </div>
            <TextField isInvalid={normalizedRejectReason.length === 0} className="mb-4"><Label>{"직접 작성"}</Label><TextArea value={rejectReason} onChange={(event) => {
                setSelectedRejectReason(CUSTOM_REJECT_REASON_VALUE);
                setRejectReason(event.target.value);
            }} {...{ maxLength: 255 }}></TextArea><Description>{`${normalizedRejectReason.length}/255`}</Description></TextField>
            <aside role="alert" className="rounded-lg border p-3">
              선택한 사진의 승인을 취소하고 앱 푸시로 변경을 요청합니다. 문자(SMS)는 발송하지 않습니다.
            </aside>
          </div>)}
        {(action === 'delete' || action === 'reject') && removesLastApprovedImage && <aside role="alert" className="rounded-lg border p-3">승인된 사진이 모두 없어지는 회원이 있습니다. 처리하면 사진 재업로드가 필요합니다.</aside>}
        {action === 'delete'  && (<aside role="alert" className="rounded-lg border p-3" style={{ marginTop: 16 }}>
            삭제는 되돌리기 어려운 조치입니다. 명백히 부적절한 이미지만 선택하세요.
          </aside>)}
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={onClose} isDisabled={busy} variant="tertiary">
          취소
        </Button>
        <Button onPress={() => onConfirm(action === 'reject' ? normalizedRejectReason : undefined)} isDisabled={busy || (action === 'reject' && normalizedRejectReason.length === 0)} variant="primary">
          처리
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
