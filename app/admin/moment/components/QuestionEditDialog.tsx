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
} from '@mui/material';
import type { QuestionDetail } from '@/types/moment';

interface QuestionEditDialogProps {
  open: boolean;
  onClose: () => void;
  question: QuestionDetail | null;
  onSave: (id: string, data: { text?: string; options?: { text: string; order: number }[] }) => Promise<void>;
  processing: boolean;
}

export default function QuestionEditDialog({
  open,
  onClose,
  question,
  onSave,
  processing,
}: QuestionEditDialogProps) {
  const [text, setText] = useState('');
  const [options, setOptions] = useState<{ text: string; order: number }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (question) {
      setText(question.text);
      setOptions(
        question.options
          .sort((a, b) => a.order - b.order)
          .map((o) => ({ text: o.text, order: o.order }))
      );
    }
  }, [question]);

  const handleOptionChange = (index: number, value: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text: value } : opt))
    );
  };

  const handleSave = async () => {
    if (!question) return;

    if (!text.trim()) {
      setError('질문 텍스트를 입력해주세요.');
      return;
    }

    if (options.some((o) => !o.text.trim())) {
      setError('모든 선택지를 입력해주세요.');
      return;
    }

    setError(null);

    try {
      await onSave(question.id, {
        text: text.trim(),
        options: options.map((o) => ({ text: o.text.trim(), order: o.order })),
      });
    } catch (err) {
      setError('저장에 실패했습니다.');
    }
  };

  const handleClose = () => {
    setError(null);
    onClose();
  };

  if (!question) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>질문 수정</DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <TextField
          label="질문 텍스트"
          value={text}
          onChange={(e) => setText(e.target.value)}
          fullWidth
          multiline
          rows={3}
          sx={{ mb: 3 }}
        />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          선택지 (5개 필수)
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {options.map((option, index) => (
            <TextField
              key={index}
              label={`선택지 ${option.order}`}
              value={option.text}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              size="small"
              fullWidth
            />
          ))}
        </Box>

        <Alert severity="info" sx={{ mt: 2 }}>
          번역된 질문(JP 스키마)은 자동으로 업데이트되지 않습니다. 수정 후 다시 번역해주세요.
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={processing}>
          취소
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={processing}
        >
          {processing ? <CircularProgress size={24} /> : '저장'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
