'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Slider,
  LinearProgress,
  Alert,
  Chip,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type { DormantUserResponse } from '@/types/admin';

interface BulkProcessModalProps {
  open: boolean;
  onClose: () => void;
  selectedUsers: DormantUserResponse[];
  onComplete: () => void;
}

interface ProcessResult {
  success: number;
  failed: number;
  totalViewed: number;
  totalRejected: number;
  totalProcessed: number;
}

export default function BulkProcessModal({
  open,
  onClose,
  selectedUsers,
  onComplete,
}: BulkProcessModalProps) {
  const [rejectionRate, setRejectionRate] = useState(0.2);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');

  const handleProcess = async () => {
    if (selectedUsers.length === 0) return;

    const confirmed = confirm(
      `선택한 ${selectedUsers.length}명의 파묘 계정에 대해\n` +
      `모든 미확인 좋아요를 일괄 처리하시겠습니까?\n\n` +
      `거절률: ${Math.round(rejectionRate * 100)}%`
    );

    if (!confirmed) return;

    setProcessing(true);
    setProgress(0);
    setError('');

    const results: ProcessResult = {
      success: 0,
      failed: 0,
      totalViewed: 0,
      totalRejected: 0,
      totalProcessed: 0,
    };

    for (let i = 0; i < selectedUsers.length; i++) {
      const user = selectedUsers[i];
      setCurrentUser(user.name);
      setProgress(Math.round((i / selectedUsers.length) * 100));

      try {
        const likes = await AdminService.dormantLikes.getPendingLikes(user.id);

        if (likes.length === 0) {
          results.success++;
          continue;
        }

        const allLikeIds = likes.map((like) => like.matchLikeId);
        const response = await AdminService.dormantLikes.processLikes({
          dormantUserId: user.id,
          matchLikeIds: allLikeIds,
          rejectionRate,
        });

        results.success++;
        results.totalViewed += response.viewedCount;
        results.totalRejected += response.rejectedCount;
        results.totalProcessed += response.processedCount;
      } catch (err: any) {
        console.error(`Failed to process user ${user.id}:`, err);
        results.failed++;
      }
    }

    setProgress(100);
    setCurrentUser('');
    setResult(results);
    setProcessing(false);
  };

  const handleClose = () => {
    if (processing) return;

    if (result) {
      onComplete();
    }
    setResult(null);
    setProgress(0);
    setRejectionRate(0.2);
    setError('');
    onClose();
  };

  const totalPendingLikes = selectedUsers.reduce(
    (sum, user) => sum + user.pendingLikeCount,
    0
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>일괄 처리</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {result ? (
          <Box sx={{ py: 2 }}>
            <Alert
              severity={result.failed > 0 ? 'warning' : 'success'}
              sx={{ mb: 2 }}
            >
              {result.failed > 0
                ? `일부 처리가 실패했습니다 (${result.failed}건 실패)`
                : '모든 처리가 완료되었습니다!'}
            </Alert>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">처리 성공</Typography>
                <Typography fontWeight="bold">{result.success}명</Typography>
              </Box>
              {result.failed > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="error">처리 실패</Typography>
                  <Typography fontWeight="bold" color="error">
                    {result.failed}명
                  </Typography>
                </Box>
              )}
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">프로필 노출</Typography>
                <Typography fontWeight="bold" sx={{ color: '#10b981' }}>
                  {result.totalViewed}개
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">거절</Typography>
                <Typography fontWeight="bold" sx={{ color: '#ef4444' }}>
                  {result.totalRejected}개
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">총 처리</Typography>
                <Typography fontWeight="bold">
                  {result.totalProcessed}개
                </Typography>
              </Box>
            </Box>
          </Box>
        ) : processing ? (
          <Box sx={{ py: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              처리 중... ({currentUser})
            </Typography>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" align="center">
              {progress}%
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                선택된 계정
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip
                  label={`${selectedUsers.length}명`}
                  color="primary"
                  size="small"
                />
                <Typography variant="body2" color="text.secondary">
                  (총 {totalPendingLikes}개 미확인 좋아요)
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
              <Typography variant="body2" fontWeight="bold" gutterBottom>
                거절 비율
              </Typography>
              <Slider
                value={rejectionRate}
                onChange={(_, value) => setRejectionRate(value as number)}
                min={0}
                max={1}
                step={0.1}
                marks={[
                  { value: 0, label: '0%' },
                  { value: 0.2, label: '20%' },
                  { value: 0.5, label: '50%' },
                  { value: 1, label: '100%' },
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${Math.round(value * 100)}%`}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                약 {Math.round(totalPendingLikes * rejectionRate)}개 거절,{' '}
                {Math.round(totalPendingLikes * (1 - rejectionRate))}개 프로필
                노출 예정
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        {result ? (
          <Button onClick={handleClose} variant="contained">
            확인
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} disabled={processing}>
              취소
            </Button>
            <Button
              onClick={handleProcess}
              variant="contained"
              disabled={processing || selectedUsers.length === 0}
            >
              {processing ? '처리 중...' : '처리하기'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
