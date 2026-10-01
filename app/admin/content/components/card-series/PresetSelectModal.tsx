'use client';
import { Button, Spinner, Modal } from '@heroui/react';
import { CircleCheck as CheckCircleIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminService from '@/app/services/admin';
import type { BackgroundPreset } from '@/types/admin';
interface PresetSelectModalProps {
    open: boolean;
    onClose: () => void;
    onSelect: (preset: BackgroundPreset) => void;
    selectedPresetId?: string;
}
export default function PresetSelectModal({ open, onClose, onSelect, selectedPresetId }: PresetSelectModalProps) {
    const [presets, setPresets] = useState<BackgroundPreset[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tempSelectedId, setTempSelectedId] = useState<string | undefined>(selectedPresetId);
    useEffect(() => {
        if (open) {
            fetchPresets();
            setTempSelectedId(selectedPresetId);
        }
    }, [open, selectedPresetId]);
    const fetchPresets = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await AdminService.backgroundPresets.getActive();
            const presets = Array.isArray(response) ? response : (response?.data || []);
            setPresets(presets);
        }
        catch (err: any) {
            setError('프리셋 목록을 불러오는데 실패했습니다.');
        }
        finally {
            setLoading(false);
        }
    };
    const handleSelect = () => {
        if (!tempSelectedId) {
            setError('프리셋을 선택해주세요.');
            return;
        }
        const selectedPreset = presets.find(p => p.id === tempSelectedId);
        if (selectedPreset) {
            onSelect(selectedPreset);
            onClose();
        }
    };
    const handleClose = () => {
        setError(null);
        onClose();
    };
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog>
      <Modal.Heading>배경 프리셋 선택</Modal.Heading>
      <Modal.Body>
        <div style={{ paddingTop: 16 }}>
          {error && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
              {error}
            </aside>)}

          {loading ? (<div style={{ display: 'flex', justifyContent: 'center', paddingBlock: 32 }}>
              <Spinner size="sm"></Spinner>
            </div>) : presets.length === 0 ? (<div style={{ textAlign: 'center', paddingBlock: 32 }}>
              <p>
                등록된 프리셋이 없습니다.
              </p>
            </div>) : (<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {presets.map((preset) => (<div key={preset.id} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div style={{ position: 'relative', border: tempSelectedId === preset.id ? '3px solid #1976d2' : '1px solid #e0e0e0', cursor: 'pointer', transition: 'all 0.2s' }} className="rounded-xl border p-4">
                    <Button onPress={() => setTempSelectedId(preset.id)} className="rounded-xl border p-4" type="button" variant="secondary">
                      <img height="160" src={preset.imageUrl || preset.thumbnailUrl} alt={preset.displayName} style={{ objectFit: 'cover' }}></img>
                      <div style={{ padding: 12, textAlign: 'center' }}>
                        <p>
                          {preset.displayName}
                        </p>
                      </div>
                    </Button>
                    {tempSelectedId === preset.id && (<div style={{ position: 'absolute', top: 8, right: 8, backgroundColor: "var(--accent)", borderRadius: '50%', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckCircleIcon style={{ color: 'white', fontSize: 20 }}></CheckCircleIcon>
                      </div>)}
                  </div>
                </div>))}
            </div>)}
        </div>
      </Modal.Body>
      <Modal.Footer style={{ paddingInline: 24, paddingBottom: 16 }}>
        <Button onPress={handleClose} variant="tertiary">
          취소
        </Button>
        <Button onPress={handleSelect} isDisabled={loading || !tempSelectedId} variant="primary">
          선택
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
