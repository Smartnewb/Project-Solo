'use client';
import { Button, Spinner, Modal, TextField, Label, Input, Description } from '@heroui/react';
import { Trash2 as DeleteIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminService from '@/app/services/admin';
import type { BackgroundPreset } from '@/types/admin';
interface PresetEditModalProps {
    open: boolean;
    preset: BackgroundPreset | null;
    onClose: () => void;
    onSuccess: () => void;
    onDelete: (id: string) => void;
}
export default function PresetEditModal({ open, preset, onClose, onSuccess, onDelete }: PresetEditModalProps) {
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [order, setOrder] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    useEffect(() => {
        if (preset && open) {
            setName(preset.name);
            setDisplayName(preset.displayName);
            setOrder(preset.order);
            setError(null);
        }
    }, [preset, open]);
    const handleSave = async () => {
        if (!preset)
            return;
        if (!name.trim()) {
            setError('프리셋 이름을 입력해주세요.');
            return;
        }
        if (!displayName.trim()) {
            setError('표시 이름을 입력해주세요.');
            return;
        }
        try {
            setSaving(true);
            setError(null);
            await AdminService.backgroundPresets.update(preset.id, {
                name: name.trim(),
                displayName: displayName.trim(),
                order
            });
            onSuccess();
            handleClose();
        }
        catch (err: any) {
            setError(err.response?.data?.message || '프리셋 수정에 실패했습니다.');
        }
        finally {
            setSaving(false);
        }
    };
    const handleDeleteClick = () => {
        if (!preset)
            return;
        if (confirm(`"${preset.displayName}" 프리셋을 삭제하시겠습니까?`)) {
            onDelete(preset.id);
            handleClose();
        }
    };
    const handleClose = () => {
        if (saving)
            return;
        setError(null);
        onClose();
    };
    if (!preset)
        return null;
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>프리셋 수정</span>
        <Button onPress={handleDeleteClick} variant="tertiary" isIconOnly={true} aria-label={"프리셋 삭제"}>
          <DeleteIcon></DeleteIcon>
        </Button>
      </Modal.Heading>
      <Modal.Body>
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && (<aside role="alert" className="rounded-lg border p-3">
              {error}
            </aside>)}

          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <img src={preset.imageUrl || preset.thumbnailUrl} alt={preset.displayName} style={{ width: 100, height: 125, objectFit: 'cover', borderRadius: 1, border: '1px solid' }}></img>
            <div style={{ flex: 1 }}>
              <p>
                이미지 URL
              </p>
              <p style={{ wordBreak: 'break-all', color: "#6b7280", fontSize: 11, marginTop: 4 }}>
                {preset.imageUrl}
              </p>
            </div>
          </div>

          <TextField isRequired={true} className="mb-4"><Label>{"프리셋 이름 (어드민용)"}</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: gradient_blue" required></Input><Description>{"영문, 숫자, 언더스코어 권장"}</Description></TextField>

          <TextField isRequired={true} className="mb-4"><Label>{"표시 이름 (사용자용)"}</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="예: 푸른 그라데이션" required></Input></TextField>

          <TextField className="mb-4"><Label>{"정렬 순서"}</Label><Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)}></Input><Description>{"낮은 숫자가 먼저 표시됩니다"}</Description></TextField>
        </div>
      </Modal.Body>
      <Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
        <Button onPress={handleClose} isDisabled={saving} variant="tertiary">
          취소
        </Button>
        <Button onPress={handleSave} isDisabled={saving} variant="primary">
          {saving ? <Spinner size="sm"></Spinner> : '저장'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
