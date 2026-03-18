'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import type { BulkCreateResult, CreateStyleReferenceRequest } from '@/app/services/admin';

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (items: CreateStyleReferenceRequest[]) => Promise<BulkCreateResult>;
  isLoading: boolean;
}

export function StyleReferenceBulkDialog({ open, onClose, onSubmit, isLoading }: Props) {
  const [jsonText, setJsonText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [result, setResult] = useState<BulkCreateResult | null>(null);

  const handleClose = () => {
    setJsonText('');
    setParseError(null);
    setResult(null);
    onClose();
  };

  const handleSubmit = async () => {
    setParseError(null);
    let items: CreateStyleReferenceRequest[];
    try {
      const parsed = JSON.parse(jsonText);
      items = Array.isArray(parsed) ? parsed : parsed.items;
      if (!Array.isArray(items)) throw new Error('items 배열이 필요합니다.');
    } catch (e: any) {
      setParseError(`JSON 파싱 오류: ${e.message}`);
      return;
    }
    try {
      const res = await onSubmit(items);
      setResult(res);
    } catch (e: any) {
      setParseError(e?.response?.data?.message ?? '일괄 등록에 실패했습니다.');
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>일괄 등록</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            JSON 배열을 붙여넣으세요. tags 미입력 항목은 AI가 자동 분석합니다.
          </Typography>

          <Typography variant="caption" component="pre" sx={{ bgcolor: 'grey.100', p: 1, borderRadius: 1, fontSize: 11 }}>
{`[
  { "imageUrl": "https://...", "category": "VIBE", "gender": "FEMALE" },
  { "imageUrl": "https://...", "tags": ["chic"], "category": "FASHION", "gender": "MALE" }
]`}
          </Typography>

          <TextField
            multiline
            rows={8}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="JSON 붙여넣기..."
            size="small"
            fullWidth
            disabled={!!result}
          />

          {parseError && <Alert severity="error">{parseError}</Alert>}

          {result && (
            <Alert severity={result.errors.length > 0 ? 'warning' : 'success'}>
              <Typography variant="body2">
                ✓ 등록 완료: {result.created}개
                {result.analyzed > 0 && ` (AI 분석: ${result.analyzed}개)`}
              </Typography>
              {result.errors.length > 0 && (
                <Typography variant="body2" color="error.main">
                  ✗ 실패: {result.errors.length}개
                </Typography>
              )}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{result ? '닫기' : '취소'}</Button>
        {!result && (
          <Button variant="contained" onClick={handleSubmit} disabled={isLoading || !jsonText.trim()}>
            {isLoading ? '등록 중...' : '일괄 등록'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
