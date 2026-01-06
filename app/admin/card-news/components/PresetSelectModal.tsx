'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardMedia,
  CardActionArea
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AdminService from '@/app/services/admin';
import type { BackgroundPreset } from '@/types/admin';

interface PresetSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (preset: BackgroundPreset) => void;
  selectedPresetId?: string;
}

export default function PresetSelectModal({
  open,
  onClose,
  onSelect,
  selectedPresetId
}: PresetSelectModalProps) {
  const [presets, setPresets] = useState<BackgroundPreset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempSelectedId, setTempSelectedId] = useState<string | undefined>(selectedPresetId);

  useEffect(() => {
    if (open) {
      fetchPresets();
      setTempSelectedId(selectedPresetId);
    }
  }, [open, selectedPresetId]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.backgroundPresets.getActive();
      const presets = Array.isArray(response) ? response : (response?.data || []);
      setPresets(presets);
    } catch (err: any) {
      console.error('프리셋 목록 조회 실패:', err);
      setError('프리셋 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (!tempSelectedId) {
      setError('프리셋을 선택해주세요.');
      return;
    }

    const selectedPreset = presets.find(p => p.id === tempSelectedId);
    if (selectedPreset) {
      onSelect(selectedPreset);
      onClose();
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>배경 프리셋 선택</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : presets.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                등록된 프리셋이 없습니다.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {presets.map((preset) => (
                <Grid item xs={6} sm={4} md={3} key={preset.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      position: 'relative',
                      border: tempSelectedId === preset.id ? '3px solid #1976d2' : '1px solid #e0e0e0',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 3,
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardActionArea onClick={() => setTempSelectedId(preset.id)}>
                      <CardMedia
                        component="img"
                        height="160"
                        image={preset.imageUrl || preset.thumbnailUrl}
                        alt={preset.displayName}
                        sx={{ objectFit: 'cover' }}
                      />
                      <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography
                          variant="body2"
                          fontWeight={tempSelectedId === preset.id ? 'bold' : 'normal'}
                          color={tempSelectedId === preset.id ? 'primary' : 'text.primary'}
                        >
                          {preset.displayName}
                        </Typography>
                      </Box>
                    </CardActionArea>
                    {tempSelectedId === preset.id && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'primary.main',
                          borderRadius: '50%',
                          p: 0.5,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                      </Box>
                    )}
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>
          취소
        </Button>
        <Button
          onClick={handleSelect}
          variant="contained"
          disabled={loading || !tempSelectedId}
        >
          선택
        </Button>
      </DialogActions>
    </Dialog>
  );
}
