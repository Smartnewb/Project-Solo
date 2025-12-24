'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import AdminService from '@/app/services/admin';

// Quill을 동적으로 로드 (SSR 방지)
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface CardSection {
  order: number;
  title: string;
  content: string;
  imageUrl?: string;
}

interface CardEditorProps {
  section: CardSection;
  onUpdate: (section: CardSection) => void;
  onDelete: () => void;
  canDelete: boolean;
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
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'link'
];

export default function CardEditor({
  section,
  onUpdate,
  onDelete,
  canDelete
}: CardEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...section, title: e.target.value });
  };

  const handleContentChange = (value: string) => {
    onUpdate({ ...section, content: value });
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.match(/^image\/(jpeg|png)$/)) {
      alert('JPG 또는 PNG 파일만 업로드 가능합니다.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('파일 크기는 10MB 이하여야 합니다.');
      return;
    }

    try {
      setUploadingImage(true);
      const response = await AdminService.cardNews.uploadSectionImage(file);
      onUpdate({ ...section, imageUrl: response.url });
    } catch (error: any) {
      console.error('섹션 이미지 업로드 실패:', error);
      alert(error.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleRemoveImage = () => {
    onUpdate({ ...section, imageUrl: undefined });
  };

  return (
    <Paper sx={{ p: 3, mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <DragIndicatorIcon sx={{ mr: 1, color: 'text.secondary', cursor: 'grab' }} />
        <Typography variant="h6" sx={{ flex: 1 }}>
          카드 {section.order + 1}
        </Typography>
        {canDelete && (
          <IconButton onClick={onDelete} color="error" size="small">
            <DeleteIcon />
          </IconButton>
        )}
      </Box>

      <TextField
        fullWidth
        label="카드 제목"
        value={section.title}
        onChange={handleTitleChange}
        placeholder="카드 제목을 입력하세요 (최대 50자)"
        inputProps={{ maxLength: 50 }}
        sx={{ mb: 2 }}
        required
      />

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          카드 본문 * (최대 500자)
        </Typography>
        <Box sx={{ '& .ql-container': { minHeight: '200px' } }}>
          <ReactQuill
            value={section.content}
            onChange={handleContentChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder="카드 본문을 입력하세요... (마크다운 지원: 굵게, 기울임, 목록, 링크)"
          />
        </Box>
        <Typography variant="caption" color="text.secondary">
          {section.content.length}/500자
        </Typography>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          섹션 이미지 (선택 사항)
        </Typography>

        {section.imageUrl ? (
          <Box>
            <Box
              component="img"
              src={section.imageUrl}
              alt="섹션 이미지"
              sx={{
                width: '100%',
                maxWidth: 400,
                height: 'auto',
                borderRadius: 1,
                border: '1px solid #e0e0e0',
                mb: 1
              }}
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                component="label"
                disabled={uploadingImage}
              >
                {uploadingImage ? '업로드 중...' : '이미지 변경'}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                />
              </Button>
              <Button
                variant="outlined"
                size="small"
                color="error"
                startIcon={<CloseIcon />}
                onClick={handleRemoveImage}
              >
                이미지 제거
              </Button>
            </Box>
          </Box>
        ) : (
          <Button
            variant="outlined"
            component="label"
            startIcon={uploadingImage ? <CircularProgress size={16} /> : <PhotoCameraIcon />}
            disabled={uploadingImage}
          >
            {uploadingImage ? '업로드 중...' : '📷 이미지 추가'}
            <input
              type="file"
              hidden
              accept="image/jpeg,image/png"
              onChange={handleImageUpload}
            />
          </Button>
        )}

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          JPG 또는 PNG 파일, 최대 10MB
        </Typography>
      </Box>
    </Paper>
  );
}
