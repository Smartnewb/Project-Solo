'use client';
import { Button, Spinner, TextField, Label, Input, TextArea, Description } from '@heroui/react';
import { Trash2 as DeleteIcon, GripVertical as DragIndicatorIcon, Camera as PhotoCameraIcon, X as CloseIcon, Copy as ContentCopyIcon, ChevronDown as ExpandMoreIcon, ChevronUp as ExpandLessIcon } from 'lucide-react';
import { useState, useCallback, useRef } from 'react';
import { Controller, type Control, useWatch } from 'react-hook-form';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';
import AdminService from '@/app/services/admin';
import { useToast } from '@/shared/ui/admin/toast';
import type { CardNewsFormData, CardNewsLayoutMode } from '@/app/admin/hooks/forms/schemas/card-news.schema';
import { isQuillEmpty } from '@/app/admin/hooks/forms/schemas/card-news.schema';
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
interface CardEditorProps {
    index: number;
    control: Control<CardNewsFormData>;
    layoutMode: CardNewsLayoutMode;
    onDelete: () => void;
    canDelete: boolean;
    onImageUploaded: (index: number, url: string) => void;
    onImageRemoved: (index: number) => void;
    onDuplicate?: (index: number) => void;
    dragHandleProps?: Record<string, any>;
}
const quillModules = {
    toolbar: [
        [{ header: [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['clean']
    ]
};
const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'
];
function CharProgress({ current, max }: {
    current: number;
    max: number;
}) {
    const ratio = current / max;
    const color = ratio >= 1 ? 'error' : ratio >= 0.8 ? 'warning' : 'primary';
    return (<div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
      <progress value={Math.min(ratio * 100, 100)} style={{ flex: 1, height: 4, borderRadius: 2 }} aria-label="처리 중"></progress>
      <p style={{ color: ratio >= 1 ? '#dc2626' : ratio >= 0.8 ? '#b45309' : '#6b7280', minWidth: 48, textAlign: 'right' }}>
        {current}/{max}
      </p>
    </div>);
}
function SectionImageUpload({ imageUrl, required, uploading, dragOver, onDragOver, onDragLeave, onDrop, onUpload, onRemove, }: {
    imageUrl?: string;
    required: boolean;
    uploading: boolean;
    dragOver: boolean;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
}) {
    const localRef = useRef<HTMLInputElement>(null);
    const emptyBorderColor = required ? '#f44336' : '#ccc';
    const emptyBgColor = required ? 'rgba(244, 67, 54, 0.04)' : 'transparent';
    const emptyIconColor = required ? '#f44336' : '#bbb';
    if (imageUrl) {
        return (<div>
        <img src={imageUrl} alt="섹션 이미지" onError={(e: any) => { e.target.style.display = 'none'; }} style={{ width: '100%', maxWidth: 400, height: 'auto', borderRadius: 1, border: '1px solid #e0e0e0', marginBottom: 8 }}></img>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button isDisabled={uploading} onPress={() => localRef.current?.click()} variant="secondary">
            {uploading ? '업로드 중...' : '이미지 변경'}
          </Button>
          <Button onPress={onRemove} variant="secondary">{<CloseIcon></CloseIcon>}
            이미지 제거
          </Button>
          <input type="file" hidden accept="image/jpeg,image/png" onChange={onUpload} ref={localRef}></input>
        </div>
      </div>);
    }
    return (<div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}  style={{ border: dragOver ? '2px dashed #ff385c' : `2px dashed ${emptyBorderColor}`, borderRadius: 2, padding: 32, textAlign: 'center', backgroundColor: dragOver ? 'rgba(122, 74, 226, 0.04)' : emptyBgColor, transition: 'all 0.2s', cursor: 'pointer' }}><Button variant="tertiary" onPress={() => localRef.current?.click()}>선택</Button>
      {uploading ? (<Spinner size="sm"></Spinner>) : (<>
          <PhotoCameraIcon style={{ fontSize: 40, color: dragOver ? '#ff385c' : emptyIconColor, marginBottom: 8 }}></PhotoCameraIcon>
          {required ? (<>
              <p>
                이미지를 업로드해주세요 (필수)
              </p>
              <p>
                드래그 앤 드롭 또는 클릭 · JPG/PNG, 최대 10MB
              </p>
            </>) : (<>
              <p>
                이미지를 여기에 드래그하거나 클릭하여 업로드
              </p>
              <p>
                JPG 또는 PNG, 최대 10MB
              </p>
            </>)}
        </>)}
      <input type="file" hidden accept="image/jpeg,image/png" onChange={onUpload} ref={localRef}></input>
    </div>);
}
export default function CardEditor({ index, control, layoutMode, onDelete, canDelete, onImageUploaded, onImageRemoved, onDuplicate, dragHandleProps, }: CardEditorProps) {
    const toast = useToast();
    const [uploadingImage, setUploadingImage] = useState(false);
    const [expanded, setExpanded] = useState(true);
    const [memoExpanded, setMemoExpanded] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const imageUrl = useWatch({ control, name: `sections.${index}.imageUrl` });
    const title = useWatch({ control, name: `sections.${index}.title` });
    const content = useWatch({ control, name: `sections.${index}.content` });
    const uploadFile = useCallback(async (file: File) => {
        if (!file.type.match(/^image\/(jpeg|png)$/)) {
            toast.error('JPG 또는 PNG 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('파일 크기는 10MB 이하여야 합니다.');
            return;
        }
        try {
            setUploadingImage(true);
            const response = await AdminService.cardNews.uploadSectionImage(file);
            onImageUploaded(index, response.url);
        }
        catch (error: any) {
            toast.error(error.message || '이미지 업로드에 실패했습니다.');
        }
        finally {
            setUploadingImage(false);
        }
    }, [index, onImageUploaded, toast]);
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        await uploadFile(file);
        event.target.value = '';
    };
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    }, []);
    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file)
            await uploadFile(file);
    }, [uploadFile]);
    const summaryText = title
        ? (title.length > 30 ? title.slice(0, 30) + '...' : title)
        : '(제목 없음)';
    const memoFilledCount = [
        title && title.trim().length > 0,
        !isQuillEmpty(content),
    ].filter(Boolean).length;
    return (<section style={{ marginBottom: 16, overflow: 'hidden' }} className="rounded-xl border bg-white p-4">
      <div  style={{ display: 'flex', alignItems: 'center', paddingInline: 16, paddingBlock: 12, cursor: 'pointer', backgroundColor: expanded ? 'transparent' : '#f9fafb', transition: 'background-color 0.2s' }}><Button variant="tertiary" onPress={() => setExpanded(prev => !prev)}>상세 펼치기</Button>
        <div {...(dragHandleProps || {})} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', cursor: dragHandleProps ? 'grab' : 'default', marginRight: 8 }}>
          <DragIndicatorIcon style={{ color: "#6b7280" }}></DragIndicatorIcon>
        </div>

        <div style={{ flex: 1 }}>
          카드 {index + 1}
          {!expanded && (<span style={{ marginLeft: 8, color: "#6b7280" }}>
              — {summaryText}
            </span>)}
        </div>

        <div onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {onDuplicate && (<span title={"카드 복제"}>
              <Button aria-label="카드 복제" onPress={() => onDuplicate(index)} variant="tertiary" isIconOnly={true}>
                <ContentCopyIcon></ContentCopyIcon>
              </Button>
            </span>)}
          {canDelete && (<span title={"카드 삭제"}>
              <Button aria-label="카드 삭제" onPress={onDelete} variant="tertiary" isIconOnly={true}>
                <DeleteIcon></DeleteIcon>
              </Button>
            </span>)}
          {expanded ? <ExpandLessIcon></ExpandLessIcon> : <ExpandMoreIcon></ExpandMoreIcon>}
        </div>
      </div>

      <div hidden={!expanded}>
        <div style={{ paddingInline: 24, paddingBottom: 24 }}>
          {layoutMode === 'article' ? (<>
              <Controller name={`sections.${index}.title`} control={control} render={({ field, fieldState }) => (<div style={{ marginBottom: 16 }}>
                    <TextField isRequired={true} isInvalid={!!fieldState.error} className="mb-4"><Label>{"카드 제목"}</Label><Input {...field} placeholder="카드 제목을 입력하세요 (최대 50자)" required {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message}</Description></TextField>
                    <CharProgress current={field.value.length} max={50}></CharProgress>
                  </div>)}></Controller>

              <div style={{ marginBottom: 16 }}>
                <p style={{ marginBottom: 8 }}>
                  카드 본문 * (최대 500자)
                </p>
                <Controller name={`sections.${index}.content`} control={control} render={({ field, fieldState }) => (<>
                      <div>
                        <ReactQuill value={field.value} onChange={field.onChange} modules={quillModules} formats={quillFormats} placeholder="카드 본문을 입력하세요... (굵게, 기울임, 목록, 링크 지원)"></ReactQuill>
                      </div>
                      <CharProgress current={field.value.length} max={500}></CharProgress>
                      {fieldState.error && (<p style={{ marginTop: 4, display: 'block' }}>
                          {fieldState.error.message}
                        </p>)}
                    </>)}></Controller>
              </div>

              <hr style={{ marginBlock: 16 }}></hr>

              <div>
                <p style={{ marginBottom: 8 }}>
                  섹션 이미지 (선택 사항)
                </p>
                <SectionImageUpload imageUrl={imageUrl} required={false} uploading={uploadingImage} dragOver={dragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onUpload={handleImageUpload} onRemove={() => onImageRemoved(index)}></SectionImageUpload>
              </div>
            </>) : (<>
              <div style={{ marginBottom: 12 }}>
                <p style={{ marginBottom: 8 }}>
                  섹션 이미지 *
                </p>
                <SectionImageUpload imageUrl={imageUrl} required uploading={uploadingImage} dragOver={dragOver} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onUpload={handleImageUpload} onRemove={() => onImageRemoved(index)}></SectionImageUpload>
                <p style={{ display: 'block', marginTop: 8 }}>
                  권장 비율: 1:1 또는 3:4 (세로형). 다른 비율도 동작하나 앱에서 레터박스가 생길 수 있습니다.
                </p>
              </div>

              <hr style={{ marginBlock: 16 }}></hr>

              <div style={{ border: '1px solid #e5e7eb', borderRadius: 4, overflow: 'hidden' }}>
                <Button variant="tertiary" aria-label="상세 펼치기" onPress={() => setMemoExpanded(prev => !prev)} style={{ display: 'flex', alignItems: 'center', paddingInline: 16, paddingBlock: 8, cursor: 'pointer', backgroundColor: '#f9fafb' }}>
                  <span style={{ flex: 1, color: "#6b7280" }}>
                    관리용 메모 (앱 미노출)
                    <span style={{ marginLeft: 8, color: '#9ca3af' }}>
                      — {memoFilledCount}개 작성됨
                    </span>
                  </span>
                  {memoExpanded ? <ExpandLessIcon></ExpandLessIcon> : <ExpandMoreIcon></ExpandMoreIcon>}
                </Button>
                <div hidden={!memoExpanded}>
                  <div style={{ padding: 16 }}>
                    <Controller name={`sections.${index}.title`} control={control} render={({ field, fieldState }) => (<div style={{ marginBottom: 16 }}>
                          <TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"카드 제목 (관리용)"}</Label><Input {...field} placeholder="운영 관리용 메모 (앱에는 노출되지 않음)" {...{ maxLength: 50 }}></Input><Description>{fieldState.error?.message}</Description></TextField>
                          <CharProgress current={field.value.length} max={50}></CharProgress>
                        </div>)}></Controller>

                    <Controller name={`sections.${index}.content`} control={control} render={({ field }) => (<div>
                          <p style={{ marginBottom: 4, display: 'block' }}>
                            카드 본문 (관리용, 최대 500자)
                          </p>
                          <TextField className="mb-4"><TextArea value={field.value} onChange={field.onChange} rows={3} placeholder="운영 관리용 메모 (앱에는 노출되지 않음)" {...{ maxLength: 500 }}></TextArea></TextField>
                          <CharProgress current={field.value.length} max={500}></CharProgress>
                        </div>)}></Controller>
                  </div>
                </div>
              </div>
            </>)}
        </div>
      </div>
    </section>);
}
