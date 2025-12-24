'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AdminService from '@/app/services/admin';

interface PresetUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PresetUploadModal({ open, onClose, onSuccess }: PresetUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
    } catch (err: any) {
      console.error('프리셋 업로드 실패:', err);
      setError(err.message || '프리셋 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    if (uploading) return;

    setSelectedFile(null);
    setPreviewUrl('');
    setName('');
    setDisplayName('');
    setOrder(0);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>배경 프리셋 추가</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box>
            <Button
              variant="outlined"
              component="label"
              startIcon={<CloudUploadIcon />}
              fullWidth
              sx={{ py: 2 }}
            >
              {selectedFile ? selectedFile.name : '이미지 선택 (JPG/PNG, 최대 5MB)'}
              <input
                type="file"
                hidden
                accept="image/jpeg,image/png"
                onChange={handleFileSelect}
              />
            </Button>
          </Box>

          {previewUrl && (
            <Box
              sx={{
                width: '100%',
                aspectRatio: '4/5',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid #e0e0e0'
              }}
            >
              <img
                src={previewUrl}
                alt="미리보기"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
            </Box>
          )}

          <TextField
            label="프리셋 이름 (어드민용)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: gradient_blue"
            fullWidth
            required
            helperText="영문, 숫자, 언더스코어만 사용 가능"
          />

          <TextField
            label="표시 이름 (사용자용)"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="예: 푸른 그라데이션"
            fullWidth
            required
          />

          <TextField
            label="정렬 순서"
            type="number"
            value={order}
            onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
            fullWidth
            helperText="낮은 숫자가 먼저 표시됩니다"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={uploading || !selectedFile}
        >
          {uploading ? <CircularProgress size={24} /> : '추가'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
