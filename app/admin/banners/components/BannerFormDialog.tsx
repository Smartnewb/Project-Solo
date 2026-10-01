'use client';
import { Button, Modal, TextField, Label, Input, Description, Select, ListBox, Checkbox } from '@heroui/react';
import { Upload as CloudUploadIcon } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import type { Banner, BannerPosition, CreateBannerRequest } from '@/types/admin';
import { useAdminForm } from '@/app/admin/hooks/forms';
import { bannerSchema, type BannerFormValues } from '@/app/admin/hooks/forms/schemas/banner.schema';
interface BannerFormDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (imageFile: File | null, data: CreateBannerRequest) => Promise<void>;
    editBanner?: Banner | null;
}
function toLocalDateTimeString(isoString: string | null): string {
    if (!isoString)
        return '';
    const date = new Date(isoString);
    const offset = date.getTimezoneOffset() * 60000;
    const localDate = new Date(date.getTime() - offset);
    return localDate.toISOString().slice(0, 16);
}
export default function BannerFormDialog({ open, onClose, onSubmit, editBanner, }: BannerFormDialogProps) {
    // File upload state kept separate (not in react-hook-form)
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [fileError, setFileError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const isEditMode = !!editBanner;
    const { control, handleFormSubmit, reset, watch } = useAdminForm<BannerFormValues>({
        schema: bannerSchema,
        defaultValues: {
            position: 'home',
            actionUrl: '',
            isUnlimited: true,
            startDate: '',
            endDate: '',
        },
    });
    const isUnlimited = watch('isUnlimited');
    useEffect(() => {
        if (editBanner) {
            setPreviewUrl(editBanner.imageUrl);
            reset({
                position: editBanner.position,
                actionUrl: editBanner.actionUrl || '',
                isUnlimited: !editBanner.startDate && !editBanner.endDate,
                startDate: toLocalDateTimeString(editBanner.startDate),
                endDate: toLocalDateTimeString(editBanner.endDate),
            });
        }
        else {
            resetForm();
        }
    }, [editBanner, open]);
    const resetForm = () => {
        setImageFile(null);
        setPreviewUrl('');
        setFileError('');
        reset({
            position: 'home',
            actionUrl: '',
            isUnlimited: true,
            startDate: '',
            endDate: '',
        });
    };
    const handleClose = () => {
        resetForm();
        onClose();
    };
    const validateFile = (file: File): boolean => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setFileError('JPG, PNG, WebP 파일만 업로드 가능합니다.');
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFileError('파일 크기는 5MB 이하여야 합니다.');
            return false;
        }
        return true;
    };
    const handleFileChange = (file: File) => {
        if (!validateFile(file))
            return;
        setImageFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setFileError('');
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file)
            handleFileChange(file);
    };
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);
    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file)
            handleFileChange(file);
    }, []);
    const onFormSubmit = handleFormSubmit(async (data: BannerFormValues) => {
        if (!isEditMode && !imageFile) {
            setFileError('이미지를 선택해주세요.');
            return;
        }
        setLoading(true);
        try {
            const requestData: CreateBannerRequest = {
                position: data.position as BannerPosition,
                actionUrl: data.actionUrl || undefined,
                startDate: data.isUnlimited ? undefined : data.startDate ? new Date(data.startDate).toISOString() : undefined,
                endDate: data.isUnlimited ? undefined : data.endDate ? new Date(data.endDate).toISOString() : undefined,
            };
            await onSubmit(imageFile, requestData);
            handleClose();
        }
        finally {
            setLoading(false);
        }
    });
    return (<Modal.Backdrop isOpen={open} onOpenChange={next => {
            if (!next)
                handleClose();
        }}><Modal.Container size="lg"><Modal.Dialog>
      <Modal.Heading>{isEditMode ? '배너 수정' : '배너 등록'}</Modal.Heading>
      <Modal.Body>
        {fileError && (<aside role="alert" className="rounded-lg border p-3" style={{ marginBottom: 16 }}>
            {fileError}
          </aside>)}

        <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} style={{ border: '2px dashed', borderRadius: 2, padding: 24, marginBottom: 24, textAlign: 'center', backgroundColor: isDragOver ? 'primary.50' : 'grey.50', cursor: 'pointer', transition: 'all 0.2s ease' }}>
          <Button variant="secondary" aria-label="배너 이미지 선택" onPress={() => document.getElementById('banner-image-input')?.click()}>이미지 선택</Button>
          <input id="banner-image-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleInputChange} style={{ display: 'none' }}></input>

          {previewUrl ? (<img src={previewUrl} alt="미리보기" style={{ maxWidth: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 1 }}/>) : (<>
              <CloudUploadIcon style={{ fontSize: 48, color: 'grey.400', marginBottom: 8 }}></CloudUploadIcon>
              <p>
                클릭하거나 이미지를 드래그하세요
              </p>
              <p>
                JPG, PNG, WebP (최대 5MB)
              </p>
            </>)}
        </div>

        <Controller name="position" control={control} render={({ field }) => (<div style={{ marginBottom: 16 }}>
              <label>위치</label>
              <Select {...field} isDisabled={isEditMode} aria-label={"위치"} className="min-w-[120px]"><Select.Trigger><Select.Value></Select.Value><Select.Indicator></Select.Indicator></Select.Trigger><Select.Popover><ListBox>
                <ListBox.Item id={"home"} textValue={"\uD648"}>홈</ListBox.Item>
                <ListBox.Item id={"moment"} textValue={"\uBAA8\uBA3C\uD2B8"}>모먼트</ListBox.Item>
              </ListBox></Select.Popover></Select>
            </div>)}></Controller>

        <Controller name="actionUrl" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"액션 URL (선택)"}</Label><Input {...field} placeholder="/matching 또는 https://example.com"></Input><Description>{fieldState.error?.message || '/ 로 시작하면 앱 내 이동, http로 시작하면 외부 링크'}</Description></TextField>)}></Controller>

        <Controller name="isUnlimited" control={control} render={({ field }) => (<Checkbox isSelected={field.value} onChange={checked => field.onChange(checked)} className="inline-flex items-center gap-2 mr-4"><Checkbox.Content><Checkbox.Control><Checkbox.Indicator></Checkbox.Indicator></Checkbox.Control>{"상시 게시 (기간 제한 없음)"}</Checkbox.Content></Checkbox>)}></Controller>

        {!isUnlimited && (<div style={{ display: 'flex', gap: 16 }}>
            <Controller name="startDate" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"시작일"}</Label><Input {...field} type="datetime-local"></Input><Description>{fieldState.error?.message}</Description></TextField>)}></Controller>
            <Controller name="endDate" control={control} render={({ field, fieldState }) => (<TextField isInvalid={!!fieldState.error} className="mb-4"><Label>{"종료일"}</Label><Input {...field} type="datetime-local"></Input><Description>{fieldState.error?.message}</Description></TextField>)}></Controller>
          </div>)}
      </Modal.Body>

      <Modal.Footer>
        <Button onPress={handleClose} isDisabled={loading} variant="tertiary">
          취소
        </Button>
        <Button onPress={() => void onFormSubmit()} isDisabled={loading || (!isEditMode && !imageFile)} variant="primary">
          {loading ? '저장 중...' : isEditMode ? '수정' : '등록'}
        </Button>
      </Modal.Footer>
    </Modal.Dialog></Modal.Container></Modal.Backdrop>);
}
