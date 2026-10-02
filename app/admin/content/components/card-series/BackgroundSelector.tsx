'use client';
import { Button, Spinner, Tabs } from '@heroui/react';
import { CircleCheck as CheckCircleIcon, ImagePlus as AddPhotoAlternateIcon, Upload as CloudUploadIcon, Trash2 as DeleteOutlineIcon, Pencil as EditIcon } from 'lucide-react';
import { useState, useRef, useCallback } from 'react';
import type { BackgroundPreset } from '@/types/admin';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
const MAX_BG_SIZE_MB = 10;
interface BackgroundSelectorProps {
    presets: BackgroundPreset[];
    selectedPresetId: string;
    customBackgroundUrl: string;
    backgroundType: 'PRESET' | 'CUSTOM';
    loading?: boolean;
    uploadingBackground?: boolean;
    onPresetSelect: (preset: BackgroundPreset) => void;
    onPresetEdit?: (preset: BackgroundPreset) => void;
    onCustomUpload: (file: File) => void;
    onCustomClear: () => void;
    onBackgroundTypeChange: (type: 'PRESET' | 'CUSTOM') => void;
    onAddPresetClick: () => void;
}
export default function BackgroundSelector({ presets, selectedPresetId, customBackgroundUrl, backgroundType, loading = false, uploadingBackground = false, onPresetSelect, onPresetEdit, onCustomUpload, onCustomClear, onBackgroundTypeChange, onAddPresetClick }: BackgroundSelectorProps) {
    const [isDragOver, setIsDragOver] = useState(false);
    const [hoveredPresetId, setHoveredPresetId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
        onBackgroundTypeChange(newValue === 0 ? 'PRESET' : 'CUSTOM');
    };
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (!file)
            return;
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toast.error('JPG 또는 PNG 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > MAX_BG_SIZE_MB * 1024 * 1024) {
            toast.error(`파일 크기는 ${MAX_BG_SIZE_MB}MB 이하여야 합니다.`);
            return;
        }
        onCustomUpload(file);
    }, [onCustomUpload, toast]);
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toast.error('JPG 또는 PNG 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > MAX_BG_SIZE_MB * 1024 * 1024) {
            toast.error(`파일 크기는 ${MAX_BG_SIZE_MB}MB 이하여야 합니다.`);
            return;
        }
        onCustomUpload(file);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const selectedPreset = presets.find(p => p.id === selectedPresetId);
    return (<div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p>
          배경 이미지
        </p>
      </div>

      <Tabs selectedKey={backgroundType} onSelectionChange={key => onBackgroundTypeChange(String(key) as 'PRESET' | 'CUSTOM')} className="mb-4"><Tabs.List aria-label="배경 이미지 유형"><Tabs.Tab id="PRESET">프리셋 선택<Tabs.Indicator /></Tabs.Tab><Tabs.Tab id="CUSTOM">직접 업로드<Tabs.Indicator /></Tabs.Tab></Tabs.List></Tabs>

      {backgroundType === 'PRESET' ? (<div>
          {loading ? (<div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
              {[...Array(4)].map((_, i) => (<div key={i} style={{ flexShrink: 0, borderRadius: 2 }} className="h-32 w-24 animate-pulse rounded-lg bg-gray-200"></div>))}
            </div>) : presets.length === 0 ? (<div style={{ padding: 32, textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: 2, border: '1px dashed #d1d5db' }}>
              <p style={{ marginBottom: 16 }}>
                등록된 프리셋이 없습니다.
              </p>
              <Button onPress={onAddPresetClick} variant="secondary" style={{ color: '#7A4AE2' }}>{<AddPhotoAlternateIcon></AddPhotoAlternateIcon>}
                첫 프리셋 추가하기
              </Button>
            </div>) : (<>
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 12 }}>
                {presets.map((preset) => {
                    const isSelected = selectedPresetId === preset.id;
                    const isHovered = hoveredPresetId === preset.id;
                    const imageUrl = preset.imageUrl || preset.thumbnailUrl;
                    return (<div key={preset.id}  onFocus={() => setHoveredPresetId(preset.id)} onMouseEnter={() => setHoveredPresetId(preset.id)} onMouseLeave={() => setHoveredPresetId(null)} style={{ position: 'relative', flexShrink: 0, width: 100, height: 125, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', border: isSelected ? '3px solid #7A4AE2' : '2px solid transparent', boxShadow: isSelected
                                ? '0 0 0 2px rgba(122, 74, 226, 0.2)'
                                : '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.2s ease' }}><Button variant="tertiary" aria-label={`${preset.displayName} 배경 선택`} onPress={() => onPresetSelect(preset)} className="absolute inset-0 z-[1] h-full w-full rounded-none bg-transparent" />
                      {onPresetEdit && isHovered && (<Button aria-label="프리셋 수정" onClick={(e) => {
                                e.stopPropagation();
                                onPresetEdit(preset);
                            }} variant="tertiary" isIconOnly={true} style={{ position: 'absolute', top: 4, left: 4, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.9)', width: 26, height: 26 }}>
                          <EditIcon style={{ fontSize: 16 }}></EditIcon>
                        </Button>)}
                      {imageUrl ? (<img src={imageUrl} alt={preset.displayName} onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none';
                                const parent = e.currentTarget.parentElement;
                                if (parent) {
                                    const placeholder = parent.querySelector('.image-placeholder');
                                    if (placeholder) {
                                        (placeholder as HTMLElement).style.display = 'flex';
                                    }
                                }
                            }} style={{ width: '100%', height: '100%', objectFit: 'cover' }}></img>) : null}
                      <div className="image-placeholder" style={{ display: imageUrl ? 'none' : 'flex', width: '100%', height: '100%', backgroundColor: "#e5e7eb", alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                        <AddPhotoAlternateIcon style={{ fontSize: 28, color: '#9ca3af' }}></AddPhotoAlternateIcon>
                        <p style={{ color: '#6b7280', fontSize: 10 }}>
                          이미지 없음
                        </p>
                      </div>
                      {isSelected && (<div style={{ position: 'absolute', top: 6, right: 6, backgroundColor: '#7A4AE2', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                          <CheckCircleIcon style={{ color: 'white', fontSize: 16 }}></CheckCircleIcon>
                        </div>)}
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 6, paddingTop: 16 }}>
                        <p style={{ color: 'white', fontWeight: 500, fontSize: 11, lineHeight: 1.2, display: 'block', textAlign: 'center' }}>
                          {preset.displayName}
                        </p>
                      </div>
                    </div>);
                })}

                <Button variant="tertiary" aria-label="배경 선택" onPress={onAddPresetClick} style={{ flexShrink: 0, width: 100, height: 125, borderRadius: 2, border: '2px dashed #d1d5db', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: '#f9fafb', transition: 'all 0.2s ease' }}>
                  <AddPhotoAlternateIcon style={{ fontSize: 28, color: '#9ca3af', marginBottom: 4 }}></AddPhotoAlternateIcon>
                  <p style={{ fontSize: 11 }}>
                    프리셋 추가
                  </p>
                </Button>
              </div>

              {selectedPreset && (<div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(122, 74, 226, 0.04)', borderRadius: 1.5, border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <CheckCircleIcon style={{ color: '#7A4AE2', fontSize: 18 }}></CheckCircleIcon>
                  <p>
                    선택됨: <strong style={{ color: '#7A4AE2' }}>{selectedPreset.displayName}</strong>
                  </p>
                </div>)}
            </>)}
        </div>) : (<div>
          {!customBackgroundUrl ? (<div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ padding: 32, borderRadius: 2, border: '2px dashed #d1d5db', backgroundColor: isDragOver ? 'rgba(122, 74, 226, 0.04)' : '#f9fafb', textAlign: 'center', transition: 'all 0.2s ease', cursor: 'pointer' }}><Button variant="secondary" onPress={() => fileInputRef.current?.click()}>배경 이미지 선택</Button>
              {uploadingBackground ? (<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                  <Spinner size="sm" style={{ color: '#7A4AE2' }}></Spinner>
                  <p>업로드 중...</p>
                </div>) : (<>
                  <CloudUploadIcon style={{ fontSize: 48, color: isDragOver ? '#7A4AE2' : '#9ca3af', marginBottom: 8 }}></CloudUploadIcon>
                  <p style={{ marginBottom: 4 }}>
                    이미지를 드래그하거나 클릭하여 업로드
                  </p>
                  <p>
                    JPG, PNG (최대 10MB) | 권장 비율 4:5
                  </p>
                </>)}
            </div>) : (<div style={{ position: 'relative', display: 'inline-block', borderRadius: 2, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <img src={customBackgroundUrl} alt="업로드된 배경" style={{ width: 160, height: 200, objectFit: 'cover', display: 'block' }}></img>
              <div style={{ position: 'absolute', top: 0, right: 0, left: 0, padding: 4, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <Button aria-label="배경 이미지 변경" onPress={() => fileInputRef.current?.click()} variant="tertiary" isIconOnly={true} style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                  <CloudUploadIcon style={{ fontSize: 18 }}></CloudUploadIcon>
                </Button>
                <Button aria-label="배경 이미지 삭제" onPress={onCustomClear} variant="tertiary" isIconOnly={true} style={{ backgroundColor: 'rgba(255,255,255,0.9)' }}>
                  <DeleteOutlineIcon style={{ fontSize: 18, color: "#dc2626" }}></DeleteOutlineIcon>
                </Button>
              </div>
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8 }}>
                <p style={{ color: 'white', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <CheckCircleIcon style={{ fontSize: 14 }}></CheckCircleIcon>
                  업로드 완료
                </p>
              </div>
            </div>)}

          <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png" onChange={handleFileChange}></input>
        </div>)}
    </div>);
}
