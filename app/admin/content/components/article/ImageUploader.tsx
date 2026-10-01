'use client';
import { Button, Spinner } from '@heroui/react';
import { Camera as PhotoCameraIcon, X as CloseIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import AdminService from '@/app/services/admin';
interface ImageUploaderProps {
    value: string;
    onChange: (url: string) => void;
    label?: string;
    helperText?: string;
    maxSizeMB?: number;
    aspectRatio?: string;
    previewHeight?: number;
}
export default function ImageUploader({ value, onChange, label = '이미지', helperText, maxSizeMB = 10, aspectRatio, previewHeight = 200, }: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        setError(null);
        if (!file.type.match(/^image\/(jpeg|png|gif|webp)$/)) {
            setError('JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.');
            return;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`파일 크기는 ${maxSizeMB}MB 이하여야 합니다.`);
            return;
        }
        try {
            setUploading(true);
            const response = await AdminService.sometimeArticles.uploadImage(file);
            onChange(response.url);
        }
        catch (err: any) {
            setError(err.message || '이미지 업로드에 실패했습니다.');
        }
        finally {
            setUploading(false);
            event.target.value = '';
        }
    };
    const handleRemove = () => {
        onChange('');
    };
    return (<div>
      <p style={{ marginBottom: 8 }}>
        {label}
      </p>

      {value ? (<div>
          <div style={{ position: 'relative', width: '100%', maxWidth: 400, height: previewHeight, borderRadius: 1, border: '1px solid #e0e0e0', overflow: 'hidden', marginBottom: 8 }}>
            <img src={value} alt={label} onError={(e: any) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="%23999">이미지 오류</text></svg>';
            }} style={{ width: '100%', height: '100%', objectFit: 'cover' }}></img>
            <Button onPress={handleRemove} variant="tertiary" isIconOnly={true} aria-label="이미지 삭제" style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', color: 'white' }}>
              <CloseIcon></CloseIcon>
            </Button>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button onPress={() => fileInputRef.current?.click()} isDisabled={uploading} variant="secondary">
              {uploading ? '업로드 중...' : '이미지 변경'}
              <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleUpload}></input>
            </Button>
            <Button onPress={handleRemove} variant="secondary">
              제거
            </Button>
          </div>
        </div>) : (<Button onPress={() => fileInputRef.current?.click()} isDisabled={uploading} variant="secondary" style={{ minWidth: 150 }}>{uploading ? <Spinner size="sm"></Spinner> : <PhotoCameraIcon></PhotoCameraIcon>}
          {uploading ? '업로드 중...' : '이미지 업로드'}
          <input ref={fileInputRef} type="file" hidden accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleUpload}></input>
        </Button>)}

      {error && (<p style={{ display: 'block', marginTop: 8 }}>
          {error}
        </p>)}

      {helperText && !error && (<p style={{ display: 'block', marginTop: 8 }}>
          {helperText}
        </p>)}
    </div>);
}
