'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Typography,
  IconButton,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
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

export default function ImageUploader({
  value,
  onChange,
  label = '이미지',
  helperText,
  maxSizeMB = 10,
  aspectRatio,
  previewHeight = 200,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    } catch (err: any) {
      console.error('이미지 업로드 실패:', err);
      setError(err.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>

      {value ? (
        <Box>
          <Box
            sx={{
              position: 'relative',
              width: '100%',
              maxWidth: 400,
              height: previewHeight,
              borderRadius: 1,
              border: '1px solid #e0e0e0',
              overflow: 'hidden',
              mb: 1,
              ...(aspectRatio && { aspectRatio }),
            }}
          >
            <Box
              component="img"
              src={value}
              alt={label}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
              onError={(e: any) => {
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="50" x="50" text-anchor="middle" dominant-baseline="middle" font-size="14" fill="%23999">이미지 오류</text></svg>';
              }}
            />
            <IconButton
              size="small"
              onClick={handleRemove}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                bgcolor: 'rgba(0,0,0,0.5)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' },
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              component="label"
              disabled={uploading}
            >
              {uploading ? '업로드 중...' : '이미지 변경'}
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleUpload}
              />
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="error"
              onClick={handleRemove}
            >
              제거
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          variant="outlined"
          component="label"
          startIcon={uploading ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
          disabled={uploading}
          sx={{ minWidth: 150 }}
        >
          {uploading ? '업로드 중...' : '이미지 업로드'}
          <input
            type="file"
            hidden
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleUpload}
          />
        </Button>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}

      {helperText && !error && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {helperText}
        </Typography>
      )}
    </Box>
  );
}
