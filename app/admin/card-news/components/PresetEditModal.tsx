'use client';

import { useState, useEffect } from 'react';
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
  Alert,
  IconButton
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminService from '@/app/services/admin';
import type { BackgroundPreset } from '@/types/admin';

interface PresetEditModalProps {
  open: boolean;
  preset: BackgroundPreset | null;
  onClose: () => void;
  onSuccess: () => void;
  onDelete: (id: string) => void;
}

export default function PresetEditModal({
  open,
  preset,
  onClose,
  onSuccess,
  onDelete
}: PresetEditModalProps) {
  const [name, setName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [order, setOrder] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preset && open) {
      setName(preset.name);
      setDisplayName(preset.displayName);
      setOrder(preset.order);
      setError(null);
    }
  }, [preset, open]);

  const handleSave = async () => {
    if (!preset) return;

    if (!name.trim()) {
      setError('프리셋 이름을 입력해주세요.');
      return;
    }

    if (!displayName.trim()) {
      setError('표시 이름을 입력해주세요.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await AdminService.backgroundPresets.update(preset.id, {
        name: name.trim(),
        displayName: displayName.trim(),
        order
      });

      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error('프리셋 수정 실패:', err);
      setError(err.response?.data?.message || '프리셋 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = () => {
    if (!preset) return;
    
    if (confirm(`"${preset.displayName}" 프리셋을 삭제하시겠습니까?`)) {
      onDelete(preset.id);
      handleClose();
    }
  };

  const handleClose = () => {
    if (saving) return;
    setError(null);
    onClose();
  };

  if (!preset) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>프리셋 수정</span>
        <IconButton
          onClick={handleDeleteClick}
          color="error"
          size="small"
          title="프리셋 삭제"
        >
          <DeleteIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              alignItems: 'flex-start'
            }}
          >
            <Box
              component="img"
              src={preset.imageUrl || preset.thumbnailUrl}
              alt={preset.displayName}
              sx={{
                width: 100,
                height: 125,
                objectFit: 'cover',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300'
              }}
            />
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="text.secondary">
                이미지 URL
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  wordBreak: 'break-all',
                  color: 'text.secondary',
                  fontSize: 11,
                  mt: 0.5
                }}
              >
                {preset.imageUrl}
              </Typography>
            </Box>
          </Box>

          <TextField
            label="프리셋 이름 (어드민용)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: gradient_blue"
            fullWidth
            required
            helperText="영문, 숫자, 언더스코어 권장"
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
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={saving}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
        >
          {saving ? <CircularProgress size={24} /> : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
