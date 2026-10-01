'use client';
import { Button, Spinner } from '@heroui/react';
import { Upload as CloudUploadIcon } from 'lucide-react';
import { useRef, useState } from 'react';
interface PromotionImageUploadProps {
    imageUrl: string | null;
    uploading: boolean;
    onFileSelected: (file: File) => void;
    onError?: (msg: string) => void;
}
export function PromotionImageUpload({ imageUrl, uploading, onFileSelected, onError, }: PromotionImageUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);
    const handleFile = (file: File) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heif', 'image/gif'];
        if (!allowed.includes(file.type)) {
            onError?.('jpeg/png/webp/heif/gif 형식만 허용됩니다.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            onError?.('5MB 이하 파일만 업로드 가능합니다.');
            return;
        }
        onFileSelected(file);
    };
    return (<div onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files[0];
            if (file)
                handleFile(file);
        }} style={{ border: `2px dashed ${dragging ? '#7A4AE2' : '#ccc'}`, borderRadius: 2, padding: 16, textAlign: 'center', cursor: 'pointer', backgroundColor: dragging ? '#f3f4f6' : '#ffffff', transition: 'all 0.2s', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <Button variant="secondary" aria-label="프로모션 이미지 선택" onPress={() => inputRef.current?.click()}>이미지 선택</Button>
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heif,image/gif" style={{ display: 'none' }} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file)
                handleFile(file);
            e.target.value = '';
        }}></input>
      {uploading ? (<Spinner size="sm"></Spinner>) : imageUrl ? (<div>
          <img src={imageUrl} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }}></img>
          <p>
            클릭하여 교체
          </p>
        </div>) : (<>
          <CloudUploadIcon style={{ fontSize: 40, color: "#6b7280" }}></CloudUploadIcon>
          <p>
            이미지를 드래그하거나 클릭하여 업로드
          </p>
          <p>
            jpeg/png/webp/heif/gif · 최대 5MB
          </p>
        </>)}
    </div>);
}
