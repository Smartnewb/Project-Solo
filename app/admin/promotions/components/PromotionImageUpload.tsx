'use client';

import { useRef, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface PromotionImageUploadProps {
  imageUrl: string | null;
  uploading: boolean;
  onFileSelected: (file: File) => void;
  onError?: (msg: string) => void;
}

export function PromotionImageUpload({
  imageUrl,
  uploading,
  onFileSelected,
  onError,
}: PromotionImageUploadProps) {
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

  return (
    <Box
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
      sx={{
        border: `2px dashed ${dragging ? '#1976d2' : '#ccc'}`,
        borderRadius: 2,
        p: 2,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: dragging ? 'action.hover' : 'background.paper',
        transition: 'all 0.2s',
        minHeight: 120,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heif,image/gif"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
      {uploading ? (
        <CircularProgress size={32} />
      ) : imageUrl ? (
        <Box>
          <img src={imageUrl} alt="preview" style={{ maxHeight: 100, maxWidth: '100%', objectFit: 'contain' }} />
          <Typography variant="caption" color="text.secondary" display="block" mt={1}>
            클릭하여 교체
          </Typography>
        </Box>
      ) : (
        <>
          <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" mt={1}>
            이미지를 드래그하거나 클릭하여 업로드
          </Typography>
          <Typography variant="caption" color="text.secondary">
            jpeg/png/webp/heif/gif · 최대 5MB
          </Typography>
        </>
      )}
    </Box>
  );
}
