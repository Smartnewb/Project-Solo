'use client';

import { useState } from 'react';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { CreateStyleReferenceRequest } from '@/app/services/admin';
import { STYLE_KEYWORDS, CATEGORY_LABELS } from '../constants';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateStyleReferenceRequest) => Promise<void>;
  isLoading: boolean;
}

const EMPTY: CreateStyleReferenceRequest = {
  imageUrl: '',
  thumbnailUrl: undefined,
  tags: undefined,
  category: 'VIBE',
  gender: 'FEMALE',
  sortOrder: 0,
};

export function StyleReferenceUploadDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const toast = useToast();
  const [form, setForm] = useState<CreateStyleReferenceRequest>(EMPTY);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setForm(EMPTY);
    setError(null);
    onClose();
  };

  const toggleTag = (code: string) => {
    const current = form.tags ?? [];
    const next = current.includes(code)
      ? current.filter((t) => t !== code)
      : [...current, code];
    setForm((f) => ({ ...f, tags: next.length > 0 ? next : undefined }));
  };

  const handleSubmit = async () => {
    if (!form.imageUrl.trim()) {
      setError('이미지 URL을 입력해주세요.');
      return;
    }
    setError(null);
    try {
      await onSubmit(form);
      handleClose();
    } catch (e: any) {
      const msg: string = e?.response?.data?.message ?? '등록에 실패했습니다.';
      // Vision AI 분석 실패는 toast + 인라인 에러 병행 노출
      if (msg.includes('분석') || msg.includes('analyze')) {
        toast.error('이미지 분석에 실패했습니다. 태그를 수동으로 입력해주세요.');
      }
      setError(msg);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>이미지 등록</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>

          <TextField
            label="이미지 URL *"
            value={form.imageUrl}
            onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
            size="small"
            fullWidth
            placeholder="https://cdn.example.com/..."
          />

          <TextField
            label="썸네일 URL (선택)"
            value={form.thumbnailUrl ?? ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, thumbnailUrl: e.target.value || undefined }))
            }
            size="small"
            fullWidth
          />

          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              성별 *
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={form.gender}
              onChange={(_, v) => v && setForm((f) => ({ ...f, gender: v }))}
              size="small"
              sx={{ display: 'flex' }}
            >
              <ToggleButton value="FEMALE">여성</ToggleButton>
              <ToggleButton value="MALE">남성</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          <FormControl size="small" fullWidth>
            <InputLabel>카테고리 *</InputLabel>
            <Select
              value={form.category}
              label="카테고리 *"
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value as typeof f.category }))
              }
            >
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((c) => (
                <MenuItem key={c} value={c}>{CATEGORY_LABELS[c]}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption" color="text.secondary">
              스타일 태그 (선택 — 미입력 시 AI 자동 분석)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
              {STYLE_KEYWORDS.map((kw) => {
                const selected = (form.tags ?? []).includes(kw.code);
                return (
                  <Chip
                    key={kw.code}
                    label={`${kw.emoji} ${kw.nameKo}`}
                    size="small"
                    variant={selected ? 'filled' : 'outlined'}
                    color={selected ? 'primary' : 'default'}
                    onClick={() => toggleTag(kw.code)}
                    clickable
                  />
                );
              })}
            </Box>
            {!form.tags && (
              <Alert severity="info" sx={{ mt: 1, fontSize: 12 }}>
                태그 미선택 시 Gemini Vision AI가 자동으로 분석합니다.
              </Alert>
            )}
          </Box>

          <TextField
            label="정렬 순서"
            type="number"
            value={form.sortOrder ?? 0}
            onChange={(e) =>
              setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))
            }
            size="small"
            sx={{ width: 140 }}
            helperText="낮을수록 먼저 표시"
          />

          {error && <Alert severity="error">{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={isLoading}>취소</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? '등록 중...' : '등록'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
