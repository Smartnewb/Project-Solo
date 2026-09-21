'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  LinearProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useRouter } from 'next/navigation';
import {
  useGenerate,
  usePreview,
  useQueueStats,
  useJobStatus,
} from '@/app/admin/hooks/use-card-news-generation';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { getApiErrorMessage } from '@/app/utils/errors';

const STAT_KEYS = ['waiting', 'active', 'completed', 'failed'] as const;

export default function AutoGeneratePage() {
  const router = useRouter();
  const toast = useToast();
  const [topic, setTopic] = useState('');
  const [jobId, setJobId] = useState<string | null>(null);

  const stats = useQueueStats();
  const job = useJobStatus(jobId);
  const generate = useGenerate();
  const preview = usePreview();

  const handlePreview = async () => {
    try {
      const r = await preview.mutateAsync(topic);
      toast.success(`프리뷰 생성: ${r.topic}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, '프리뷰 실패'));
    }
  };

  const handleGenerate = async () => {
    try {
      const r = await generate.mutateAsync(topic);
      setJobId(r.jobId);
      toast.success(`Job 시작: ${r.jobId}`);
    } catch (e) {
      toast.error(getApiErrorMessage(e, '생성 실패'));
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => router.push('/admin/content')}
          sx={{ mr: 2 }}
        >
          목록으로
        </Button>
        <Typography variant="h5" fontWeight="bold">
          카드뉴스 자동 생성
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 3,
          mb: 3,
        }}
      >
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            큐 상태
          </Typography>
          {stats.isLoading ? (
            <CircularProgress size={20} />
          ) : stats.data ? (
            <Box
              sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}
            >
              {STAT_KEYS.map((k) => (
                <Card key={k} variant="outlined">
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" color="text.secondary">
                      {k}
                    </Typography>
                    <Typography variant="h5">{stats.data?.[k] ?? 0}</Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Alert severity="warning">큐 상태 없음</Alert>
          )}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            5초 주기 폴링
          </Typography>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Job 진행
          </Typography>
          {jobId ? (
            <Box>
              <Typography variant="caption" color="text.secondary">
                {jobId}
              </Typography>
              <Typography>
                state: <strong>{job.data?.state ?? '...'}</strong>
              </Typography>
              <Box sx={{ my: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, Math.max(0, job.data?.progress ?? 0))}
                />
                <Typography variant="caption">{job.data?.progress ?? 0}%</Typography>
              </Box>
              {job.data?.failedReason && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {job.data.failedReason}
                </Alert>
              )}
            </Box>
          ) : (
            <Typography color="text.secondary">
              아직 시작된 작업이 없습니다.
            </Typography>
          )}
        </Paper>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          토픽 입력
        </Typography>
        <TextField
          fullWidth
          label="토픽"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="예: 봄철 연애 팁"
          sx={{ mb: 2 }}
        />
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={handlePreview}
            disabled={!topic || preview.isPending}
          >
            {preview.isPending ? '프리뷰 중...' : '프리뷰'}
          </Button>
          <Button
            variant="contained"
            onClick={handleGenerate}
            disabled={!topic || generate.isPending}
          >
            {generate.isPending ? '생성 중...' : '생성 시작'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
