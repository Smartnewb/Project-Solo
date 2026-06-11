'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { BulkCreateVideoResponse, TargetGender, VideoStatus } from '@/types/admin';
import { useBulkCreateVideos } from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';

interface Props {
  open: boolean;
  onClose: () => void;
}

function parseUrls(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

export function BulkVideoImportDialog({ open, onClose }: Props) {
  const toast = useToast();
  const bulkCreate = useBulkCreateVideos();

  const [urlsText, setUrlsText] = useState('');
  const [status, setStatus] = useState<VideoStatus>('published');
  const [targetGender, setTargetGender] = useState<TargetGender>('ALL');
  const [result, setResult] = useState<BulkCreateVideoResponse | null>(null);

  const urls = parseUrls(urlsText);
  const urlCount = urls.length;

  const handleSubmit = async () => {
    if (urlCount === 0) {
      toast.error('URL을 입력해주세요.');
      return;
    }
    try {
      const res = await bulkCreate.mutateAsync({ urls, status, targetGender });
      setResult(res);
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, '일괄 등록에 실패했습니다.'));
    }
  };

  const handleClose = () => {
    setUrlsText('');
    setStatus('published');
    setTargetGender('ALL');
    setResult(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>영상 일괄 추가</DialogTitle>
      <DialogContent>
        {!result ? (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              YouTube Shorts URL을 한 줄에 하나씩 입력하세요. 중복 영상은 자동으로 제외됩니다.
            </Typography>
            <TextField
              multiline
              rows={10}
              fullWidth
              placeholder={
                'https://youtube.com/shorts/mZz70McqsSI\nhttps://youtube.com/shorts/4wQvtfBLV60\n...'
              }
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              size="small"
              inputProps={{ style: { fontFamily: 'monospace', fontSize: 12 } }}
            />
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                select
                size="small"
                label="등록 상태"
                value={status}
                onChange={(e) => setStatus(e.target.value as VideoStatus)}
                sx={{ width: 160 }}
              >
                <MenuItem value="published">발행</MenuItem>
                <MenuItem value="draft">초안</MenuItem>
              </TextField>
              <TextField
                select
                size="small"
                label="노출 대상"
                value={targetGender}
                onChange={(e) => setTargetGender(e.target.value as TargetGender)}
                sx={{ width: 160 }}
                helperText="이 배치 전체 적용"
              >
                <MenuItem value="ALL">공통 (남녀 모두)</MenuItem>
                <MenuItem value="MALE">남성</MenuItem>
                <MenuItem value="FEMALE">여성</MenuItem>
              </TextField>
              <Typography variant="caption" color="text.secondary">
                {urlCount > 0 ? `${urlCount}개 URL 감지됨` : 'URL 미입력'}
              </Typography>
            </Box>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<CheckCircleIcon />}
                label={`성공 ${result.success.length}개`}
                color="success"
                variant="outlined"
              />
              <Chip
                icon={<ContentCopyIcon />}
                label={`중복 ${result.duplicates.length}개`}
                color="warning"
                variant="outlined"
              />
              <Chip
                icon={<ErrorIcon />}
                label={`실패 ${result.failed.length}개`}
                color="error"
                variant="outlined"
              />
            </Box>

            {result.success.length > 0 && (
              <Box>
                <Typography variant="subtitle2" color="success.main" sx={{ mb: 0.5 }}>
                  등록 성공 ({result.success.length}개)
                </Typography>
                {result.success.map((item) => (
                  <Typography key={item.videoId} variant="caption" display="block" color="text.secondary">
                    ✓ {item.title || item.videoId}
                  </Typography>
                ))}
              </Box>
            )}

            {result.duplicates.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="warning.main" sx={{ mb: 0.5 }}>
                    중복 스킵 ({result.duplicates.length}개)
                  </Typography>
                  {result.duplicates.map((item) => (
                    <Typography key={item.videoId} variant="caption" display="block" color="text.secondary">
                      ⊘ {item.videoId}
                    </Typography>
                  ))}
                </Box>
              </>
            )}

            {result.failed.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" color="error.main" sx={{ mb: 0.5 }}>
                    실패 ({result.failed.length}개)
                  </Typography>
                  {result.failed.map((item, i) => (
                    <Alert key={i} severity="error" sx={{ py: 0, mb: 0.5 }}>
                      <Typography variant="caption">
                        {item.url} — {item.error}
                      </Typography>
                    </Alert>
                  ))}
                </Box>
              </>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit">
          {result ? '닫기' : '취소'}
        </Button>
        {!result && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={bulkCreate.isPending || urlCount === 0}
            startIcon={bulkCreate.isPending ? <CircularProgress size={16} /> : undefined}
          >
            {bulkCreate.isPending ? `처리 중...` : `${urlCount}개 추가`}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
