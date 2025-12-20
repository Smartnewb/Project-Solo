'use client';

import { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Button
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

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
    [{ color: [] }, { background: [] }],
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
  'color',
  'background',
  'link'
];

export default function CardEditor({
  section,
  onUpdate,
  onDelete,
  canDelete
}: CardEditorProps) {
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...section, title: e.target.value });
  };

  const handleContentChange = (value: string) => {
    onUpdate({ ...section, content: value });
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...section, imageUrl: e.target.value });
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
          카드 본문 *
        </Typography>
        <Box sx={{ '& .ql-container': { minHeight: '200px' } }}>
          <ReactQuill
            value={section.content}
            onChange={handleContentChange}
            modules={quillModules}
            formats={quillFormats}
            placeholder="카드 본문을 입력하세요..."
          />
        </Box>
      </Box>

      <TextField
        fullWidth
        label="이미지 URL (선택 사항)"
        value={section.imageUrl || ''}
        onChange={handleImageUrlChange}
        placeholder="https://example.com/image.jpg"
        helperText="이미지 URL을 입력하거나 S3에 업로드 후 URL을 붙여넣으세요"
      />

      {section.imageUrl && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            미리보기
          </Typography>
          <Box
            component="img"
            src={section.imageUrl}
            alt="Card preview"
            sx={{
              width: '100%',
              maxWidth: 400,
              height: 'auto',
              borderRadius: 1,
              border: '1px solid #e0e0e0'
            }}
            onError={(e: any) => {
              e.target.style.display = 'none';
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
