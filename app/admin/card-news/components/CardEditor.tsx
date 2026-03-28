'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Divider,
  Collapse,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import { Controller, type Control, useWatch } from 'react-hook-form';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';
import AdminService from '@/app/services/admin';
import type { CardNewsFormData } from '@/app/admin/hooks/forms/schemas/card-news.schema';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

interface CardEditorProps {
  index: number;
  control: Control<CardNewsFormData>;
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

function CharProgress({ current, max }: { current: number; max: number }) {
  const ratio = current / max;
  const color = ratio >= 1 ? 'error' : ratio >= 0.8 ? 'warning' : 'primary';
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
      <LinearProgress
        variant="determinate"
        value={Math.min(ratio * 100, 100)}
        color={color}
        sx={{ flex: 1, height: 4, borderRadius: 2 }}
      />
      <Typography
        variant="caption"
        sx={{ color: ratio >= 1 ? 'error.main' : ratio >= 0.8 ? 'warning.main' : 'text.secondary', minWidth: 48, textAlign: 'right' }}
      >
        {current}/{max}
      </Typography>
    </Box>
  );
}

export default function CardEditor({
  index,
  control,
  onDelete,
  canDelete,
  onImageUploaded,
  onImageRemoved,
  onDuplicate,
  dragHandleProps,
}: CardEditorProps) {
  const [uploadingImage, setUploadingImage] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageUrl = useWatch({ control, name: `sections.${index}.imageUrl` });
  const title = useWatch({ control, name: `sections.${index}.title` });
  const content = useWatch({ control, name: `sections.${index}.content` });

  const uploadFile = useCallback(async (file: File) => {
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
      onImageUploaded(index, response.url);
    } catch (error: any) {
      alert(error.message || '이미지 업로드에 실패했습니다.');
    } finally {
      setUploadingImage(false);
    }
  }, [index, onImageUploaded]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
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
    if (file) await uploadFile(file);
  }, [uploadFile]);

  const summaryText = title
    ? (title.length > 30 ? title.slice(0, 30) + '...' : title)
    : '(제목 없음)';

  return (
    <Paper sx={{ mb: 2, overflow: 'hidden' }}>
      {/* Header - always visible */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: 2,
          py: 1.5,
          cursor: 'pointer',
          backgroundColor: expanded ? 'transparent' : 'grey.50',
          '&:hover': { backgroundColor: 'grey.100' },
          transition: 'background-color 0.2s',
        }}
        onClick={() => setExpanded(prev => !prev)}
      >
        <Box
          {...(dragHandleProps || {})}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{ display: 'flex', alignItems: 'center', cursor: dragHandleProps ? 'grab' : 'default', mr: 1 }}
        >
          <DragIndicatorIcon sx={{ color: 'text.secondary' }} />
        </Box>

        <Typography variant="subtitle1" fontWeight="bold" sx={{ flex: 1 }}>
          카드 {index + 1}
          {!expanded && (
            <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
              — {summaryText}
            </Typography>
          )}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
          {onDuplicate && (
            <Tooltip title="카드 복제">
              <IconButton size="small" onClick={() => onDuplicate(index)}>
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {canDelete && (
            <Tooltip title="카드 삭제">
              <IconButton onClick={onDelete} color="error" size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </Box>
      </Box>

      {/* Collapsible content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 3, pb: 3 }}>
          <Controller
            name={`sections.${index}.title`}
            control={control}
            render={({ field, fieldState }) => (
              <Box sx={{ mb: 2 }}>
                <TextField
                  {...field}
                  fullWidth
                  label="카드 제목"
                  placeholder="카드 제목을 입력하세요 (최대 50자)"
                  inputProps={{ maxLength: 50 }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  required
                />
                <CharProgress current={field.value.length} max={50} />
              </Box>
            )}
          />

          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              카드 본문 * (최대 500자)
            </Typography>
            <Controller
              name={`sections.${index}.content`}
              control={control}
              render={({ field }) => (
                <>
                  <Box sx={{ '& .ql-container': { minHeight: '200px' } }}>
                    <ReactQuill
                      value={field.value}
                      onChange={field.onChange}
                      modules={quillModules}
                      formats={quillFormats}
                      placeholder="카드 본문을 입력하세요... (굵게, 기울임, 목록, 링크 지원)"
                    />
                  </Box>
                  <CharProgress current={field.value.length} max={500} />
                </>
              )}
            />
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Image section with drag & drop */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              섹션 이미지 (선택 사항)
            </Typography>

            {imageUrl ? (
              <Box>
                <Box
                  component="img"
                  src={imageUrl}
                  alt="섹션 이미지"
                  sx={{
                    width: '100%',
                    maxWidth: 400,
                    height: 'auto',
                    borderRadius: 1,
                    border: '1px solid #e0e0e0',
                    mb: 1
                  }}
                  onError={(e: any) => { e.target.style.display = 'none'; }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" size="small" component="label" disabled={uploadingImage}>
                    {uploadingImage ? '업로드 중...' : '이미지 변경'}
                    <input type="file" hidden accept="image/jpeg,image/png" onChange={handleImageUpload} ref={fileInputRef} />
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => onImageRemoved(index)}
                  >
                    이미지 제거
                  </Button>
                </Box>
              </Box>
            ) : (
              <Box
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                sx={{
                  border: dragOver ? '2px dashed #7A4AE2' : '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  backgroundColor: dragOver ? 'rgba(122, 74, 226, 0.04)' : 'transparent',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadingImage ? (
                  <CircularProgress size={24} />
                ) : (
                  <>
                    <PhotoCameraIcon sx={{ fontSize: 40, color: dragOver ? '#7A4AE2' : '#bbb', mb: 1 }} />
                    <Typography variant="body2" color={dragOver ? 'primary' : 'text.secondary'}>
                      이미지를 여기에 드래그하거나 클릭하여 업로드
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      JPG 또는 PNG, 최대 10MB
                    </Typography>
                  </>
                )}
                <input
                  type="file"
                  hidden
                  accept="image/jpeg,image/png"
                  onChange={handleImageUpload}
                  ref={fileInputRef}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
