'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Checkbox,
  Slider,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Grid,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type {
  DormantUserResponse,
  DormantLikeDetailResponse,
  CooldownStatusResponse,
} from '@/types/admin';

interface PendingLikesModalProps {
  open: boolean;
  onClose: () => void;
  user: DormantUserResponse;
}

export default function PendingLikesModal({ open, onClose, user }: PendingLikesModalProps) {
  const [likes, setLikes] = useState<DormantLikeDetailResponse[]>([]);
  const [cooldownStatus, setCooldownStatus] = useState<CooldownStatusResponse | null>(null);
  const [selectedLikeIds, setSelectedLikeIds] = useState<string[]>([]);
  const [rejectionRate, setRejectionRate] = useState(0.2);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetchData();
    } else {
      setSelectedLikeIds([]);
      setRejectionRate(0.2);
      setError('');
    }
  }, [open, user.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [likesData, cooldownData] = await Promise.all([
        AdminService.dormantLikes.getPendingLikes(user.id),
        AdminService.dormantLikes.getCooldownStatus(user.id),
      ]);

      setLikes(likesData);
      setCooldownStatus(cooldownData);
    } catch (err: any) {
      setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = likes.slice(0, 5).map((like) => like.matchLikeId);
      setSelectedLikeIds(allIds);
    } else {
      setSelectedLikeIds([]);
    }
  };

  const handleSelectOne = (matchLikeId: string) => {
    const currentIndex = selectedLikeIds.indexOf(matchLikeId);
    const newSelected = [...selectedLikeIds];

    if (currentIndex === -1) {
      if (newSelected.length < 5) {
        newSelected.push(matchLikeId);
      } else {
        alert('최대 5개까지만 선택 가능합니다.');
        return;
      }
    } else {
      newSelected.splice(currentIndex, 1);
    }

    setSelectedLikeIds(newSelected);
  };

  const handleProcess = async () => {
    if (selectedLikeIds.length === 0) {
      alert('처리할 좋아요를 선택해주세요.');
      return;
    }

    if (cooldownStatus?.isOnCooldown) {
      alert(`쿨다운 중입니다. ${cooldownStatus.remainingMinutes}분 후에 다시 시도해주세요.`);
      return;
    }

    const expectedRejections = Math.round(selectedLikeIds.length * rejectionRate);
    const confirmed = confirm(
      `선택한 ${selectedLikeIds.length}개의 좋아요를 처리하시겠습니까?\n\n` +
      `약 ${expectedRejections}개는 거절, ${selectedLikeIds.length - expectedRejections}개는 조회 처리됩니다.`
    );

    if (!confirmed) return;

    try {
      setProcessing(true);
      const result = await AdminService.dormantLikes.processLikes({
        dormantUserId: user.id,
        matchLikeIds: selectedLikeIds,
        rejectionRate,
      });

      alert(
        `처리가 완료되었습니다.\n\n` +
        `조회: ${result.viewedCount}개\n` +
        `거절: ${result.rejectedCount}개`
      );

      onClose();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || '처리 중 오류가 발생했습니다.';
      setError(errorMsg);
      alert(errorMsg);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isSelected = (matchLikeId: string) => selectedLikeIds.indexOf(matchLikeId) !== -1;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        미확인 좋아요 관리 - {user.name}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* 파묘 계정 정보 */}
        <Box sx={{ mb: 3, p: 2, bgcolor: '#f9fafb', borderRadius: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">이름</Typography>
              <Typography variant="body1" fontWeight="bold">{user.name}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">구슬 잔액</Typography>
              <Typography variant="body1" fontWeight="bold">{user.gemBalance}개</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">미접속 일수</Typography>
              <Typography variant="body1" fontWeight="bold">{user.daysSinceLastLogin}일</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="caption" color="text.secondary">처리 상태</Typography>
              <Box>
                {cooldownStatus?.isOnCooldown ? (
                  <Chip
                    label={`${cooldownStatus.remainingMinutes}분 후 처리 가능`}
                    size="small"
                    color="warning"
                  />
                ) : (
                  <Chip label="처리 가능" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                )}
              </Box>
            </Grid>
          </Grid>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : likes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="text.secondary">미확인 좋아요가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            {/* 좋아요 목록 */}
            <TableContainer sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={
                          selectedLikeIds.length > 0 &&
                          selectedLikeIds.length < Math.min(5, likes.length)
                        }
                        checked={
                          likes.length > 0 &&
                          selectedLikeIds.length === Math.min(5, likes.length)
                        }
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell>프로필</TableCell>
                    <TableCell>이름</TableCell>
                    <TableCell>나이</TableCell>
                    <TableCell>대학교</TableCell>
                    <TableCell>경과일</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {likes.map((like) => {
                    const selected = isSelected(like.matchLikeId);
                    return (
                      <TableRow
                        key={like.matchLikeId}
                        hover
                        onClick={() => handleSelectOne(like.matchLikeId)}
                        sx={{ cursor: 'pointer' }}
                        selected={selected}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox checked={selected} />
                        </TableCell>
                        <TableCell>
                          <Avatar
                            src={like.senderMainImageUrl || undefined}
                            sx={{ width: 40, height: 40 }}
                          >
                            {like.senderName[0]}
                          </Avatar>
                        </TableCell>
                        <TableCell>{like.senderName}</TableCell>
                        <TableCell>{like.senderAge}세</TableCell>
                        <TableCell>{like.senderUniversity}</TableCell>
                        <TableCell>
                          <Chip label={`${like.daysSinceLiked}일 전`} size="small" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 처리 옵션 */}
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
                선택 {selectedLikeIds.length}개 중 약{' '}
                {Math.round(selectedLikeIds.length * rejectionRate)}개 거절 예정
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={processing}>
          취소
        </Button>
        <Button
          onClick={handleProcess}
          variant="contained"
          disabled={
            selectedLikeIds.length === 0 ||
            cooldownStatus?.isOnCooldown ||
            processing ||
            loading
          }
          startIcon={processing && <CircularProgress size={16} />}
        >
          {processing ? '처리 중...' : '처리하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
