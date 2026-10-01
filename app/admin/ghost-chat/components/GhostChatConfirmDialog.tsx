'use client';

import { Button, Modal, Spinner } from '@heroui/react';

interface GhostChatConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: 'primary' | 'error';
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function GhostChatConfirmDialog({open,title,description,confirmLabel,confirmColor='primary',loading=false,onCancel,onConfirm}:GhostChatConfirmDialogProps) {
  return <Modal.Backdrop isOpen={open} onOpenChange={next => !next && !loading && onCancel()} isDismissable={!loading} isKeyboardDismissDisabled={loading}>
    <Modal.Container size="sm"><Modal.Dialog style={{ width: '100%', maxWidth: 444, minWidth: 0 }}><Modal.Header><Modal.Heading>{title}</Modal.Heading></Modal.Header><Modal.Body><p className="text-sm text-gray-600">{description}</p></Modal.Body><Modal.Footer>
      <Button variant="secondary" onPress={onCancel} isDisabled={loading}>취소</Button><Button variant={confirmColor==='error'?'danger':'primary'} onPress={onConfirm} isDisabled={loading}>{loading && <Spinner size="sm" aria-hidden="true" />}{confirmLabel}</Button>
    </Modal.Footer></Modal.Dialog></Modal.Container>
  </Modal.Backdrop>;
}
