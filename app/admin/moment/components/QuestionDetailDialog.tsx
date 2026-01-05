'use client';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import type { QuestionDetail, Big5Dimension } from '@/types/moment';

const DIMENSION_LABELS: Record<Big5Dimension, string> = {
  openness: '개방성 (Openness)',
  conscientiousness: '성실성 (Conscientiousness)',
  extraversion: '외향성 (Extraversion)',
  agreeableness: '우호성 (Agreeableness)',
  neuroticism: '신경성 (Neuroticism)',
};

interface QuestionDetailDialogProps {
  open: boolean;
  onClose: () => void;
  question: QuestionDetail | null;
}

export default function QuestionDetailDialog({
  open,
  onClose,
  question,
}: QuestionDetailDialogProps) {
  if (!question) return null;

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>질문 상세</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Chip label={DIMENSION_LABELS[question.dimension]} color="primary" />
            <Chip label={question.type} variant="outlined" />
            <Chip label={question.isActive ? '활성' : '비활성'} color={question.isActive ? 'success' : 'default'} />
          </Box>
          <Typography variant="h6" gutterBottom>
            {question.text}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          선택지 (한국어)
        </Typography>
        <List dense>
          {question.options
            .sort((a, b) => a.order - b.order)
            .map((option) => (
              <ListItem key={option.id}>
                <ListItemText
                  primary={`${option.order}. ${option.text}`}
                />
              </ListItem>
            ))}
        </List>

        {question.translations?.jp && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              일본어 번역
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {question.translations.jp.text}
            </Typography>
            <List dense>
              {question.translations.jp.options
                .sort((a, b) => a.order - b.order)
                .map((option, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${option.order}. ${option.text}`}
                    />
                  </ListItem>
                ))}
            </List>
          </>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', gap: 4 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">
              순서 인덱스
            </Typography>
            <Typography variant="body2">{question.orderIndex}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              생성일
            </Typography>
            <Typography variant="body2">{formatDateTime(question.createdAt)}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">
              수정일
            </Typography>
            <Typography variant="body2">{formatDateTime(question.updatedAt)}</Typography>
          </Box>
        </Box>

        {question.metadata && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              메타데이터
            </Typography>
            {question.metadata.theme && (
              <Typography variant="body2">테마: {question.metadata.theme}</Typography>
            )}
            {question.metadata.keywords && (
              <Box sx={{ mt: 1 }}>
                {question.metadata.keywords.map((kw) => (
                  <Chip key={kw} label={kw} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                ))}
              </Box>
            )}
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}
