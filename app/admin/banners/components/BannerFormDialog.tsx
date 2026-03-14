'use client';

import { useState, useEffect, useCallback } from 'react';
import { Controller } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
}

export default function BannerFormDialog({
  open,
  onClose,
  onSubmit,
  editBanner,
}: BannerFormDialogProps) {
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
    } else {
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
    if (!validateFile(file)) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFileError('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileChange(file);
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
    if (file) handleFileChange(file);
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
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditMode ? '배너 수정' : '배너 등록'}</DialogTitle>
      <DialogContent>
        {fileError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {fileError}
          </Alert>
        )}

        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          sx={{
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'grey.300',
            borderRadius: 2,
            p: 3,
            mb: 3,
            textAlign: 'center',
            bgcolor: isDragOver ? 'primary.50' : 'grey.50',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => document.getElementById('banner-image-input')?.click()}
        >
          <input
            id="banner-image-input"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleInputChange}
            style={{ display: 'none' }}
          />

          {previewUrl ? (
            <Box
              component="img"
              src={previewUrl}
              alt="미리보기"
              sx={{
                maxWidth: '100%',
                maxHeight: 200,
                objectFit: 'contain',
                borderRadius: 1,
              }}
            />
          ) : (
            <>
              <CloudUploadIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
              <Typography color="text.secondary">
                클릭하거나 이미지를 드래그하세요
              </Typography>
              <Typography variant="caption" color="text.secondary">
                JPG, PNG, WebP (최대 5MB)
              </Typography>
            </>
          )}
        </Box>

        <Controller
          name="position"
          control={control}
          render={({ field }) => (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>위치</InputLabel>
              <Select
                {...field}
                label="위치"
                disabled={isEditMode}
              >
                <MenuItem value="home">홈</MenuItem>
                <MenuItem value="moment">모먼트</MenuItem>
              </Select>
            </FormControl>
          )}
        />

        <Controller
          name="actionUrl"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              fullWidth
              label="액션 URL (선택)"
              placeholder="/matching 또는 https://example.com"
              helperText={fieldState.error?.message || '/ 로 시작하면 앱 내 이동, http로 시작하면 외부 링크'}
              error={!!fieldState.error}
              sx={{ mb: 2 }}
            />
          )}
        />

        <Controller
          name="isUnlimited"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={
                <Checkbox
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                />
              }
              label="상시 게시 (기간 제한 없음)"
              sx={{ mb: 2 }}
            />
          )}
        />

        {!isUnlimited && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Controller
              name="startDate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="datetime-local"
                  label="시작일"
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
            <Controller
              name="endDate"
              control={control}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="datetime-local"
                  label="종료일"
                  InputLabelProps={{ shrink: true }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={onFormSubmit}
          disabled={loading || (!isEditMode && !imageFile)}
        >
          {loading ? '저장 중...' : isEditMode ? '수정' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
