'use client';
import { Button, Spinner, Modal, TextField, Label, Input, Description } from '@heroui/react';
import { Upload as CloudUploadIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import AdminService from '@/app/services/admin';
interface PresetUploadModalProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
}
export default function PresetUploadModal({ open, onClose, onSuccess }: PresetUploadModalProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [name, setName] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [order, setOrder] = useState<number>(0);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            setError('JPG 또는 PNG 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError('파일 크기는 5MB 이하여야 합니다.');
            return;
        }
        setError(null);
        setSelectedFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };
    const handleSubmit = async () => {
        if (!selectedFile) {
            setError('이미지를 선택해주세요.');
            return;
        }
        if (!name.trim()) {
            setError('프리셋 이름을 입력해주세요.');
            return;
        }
        if (!displayName.trim()) {
            setError('표시 이름을 입력해주세요.');
            return;
        }
        try {
            setUploading(true);
            setError(null);
            await AdminService.backgroundPresets.uploadAndCreate(selectedFile, {
                name: name.trim(),
                displayName: displayName.trim(),
                order
            });
            handleClose();
            onSuccess();
        }
        catch (err: any) {
            setError(err.message || '프리셋 업로드에 실패했습니다.');
        }
        finally {
            setUploading(false);
        }
    };
    const handleClose = () => {
        if (uploading)
            return;
        setSelectedFile(null);
        setPreviewUrl('');
        setName('');
        setDisplayName('');
        setOrder(0);
        setError(null);
        onClose();
    };
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog style={{ width: '100%', maxWidth: 600, minWidth: 0 }}>
      <Modal.Heading>배경 프리셋 추가</Modal.Heading>
      <Modal.Body>
        <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {error && (<aside role="alert" className="rounded-lg border p-3">
              {error}
            </aside>)}

          <div>
            <Button onPress={() => fileInputRef.current?.click()} fullWidth variant="secondary" style={{ paddingBlock: 16 }}>{<CloudUploadIcon></CloudUploadIcon>}
              {selectedFile ? selectedFile.name : '이미지 선택 (JPG/PNG, 최대 5MB)'}
              <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png" onChange={handleFileSelect}></input>
            </Button>
          </div>

          {previewUrl && (<div style={{ width: '100%', borderRadius: 1, overflow: 'hidden', border: '1px solid #e0e0e0' }}>
              <img src={previewUrl} alt="미리보기" style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            }}></img>
            </div>)}

          <TextField isRequired={true} className="mb-4"><Label>{"프리셋 이름 (어드민용)"}</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: gradient_blue" required></Input><Description>{"영문, 숫자, 언더스코어만 사용 가능"}</Description></TextField>

          <TextField isRequired={true} className="mb-4"><Label>{"표시 이름 (사용자용)"}</Label><Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="예: 푸른 그라데이션" required></Input></TextField>

          <TextField className="mb-4"><Label>{"정렬 순서"}</Label><Input type="number" value={order} onChange={(e) => setOrder(parseInt(e.target.value) || 0)}></Input><Description>{"낮은 숫자가 먼저 표시됩니다"}</Description></TextField>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button onPress={handleClose} isDisabled={uploading} variant="tertiary">
          취소
        </Button>
        <Button onPress={handleSubmit} isDisabled={uploading || !selectedFile} variant="primary">
          {uploading ? <Spinner size="sm"></Spinner> : '추가'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
