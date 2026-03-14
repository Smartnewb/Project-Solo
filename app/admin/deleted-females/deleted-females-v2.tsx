'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Pagination,
  TextField,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import type { DeletedFemale, RestoreFemaleResponse } from '@/types/admin';
import {
  useDeletedFemalesList,
  useRestoreDeletedFemale,
  useSleepDeletedFemale,
} from '@/app/admin/hooks';
import { useToast } from '@/shared/ui/admin/toast/toast-context';
import { useConfirm } from '@/shared/ui/admin/confirm-dialog/confirm-dialog-context';

function DeletedFemalesPageContent() {
  const toast = useToast();
  const confirmAction = useConfirm();

  const [page, setPage] = useState(1);

  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [restoreUserId, setRestoreUserId] = useState<string | null>(null);
  const [restoreUserName, setRestoreUserName] = useState('');

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [restoreResult, setRestoreResult] = useState<RestoreFemaleResponse | null>(null);

  const { data, isLoading, error } = useDeletedFemalesList(page, 20);
  const females = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalCount = data?.meta?.totalCount || 0;

  const restoreMutation = useRestoreDeletedFemale();
  const sleepMutation = useSleepDeletedFemale();

  const handleRestoreClick = (user: DeletedFemale) => {
    setRestoreUserId(user.id);
    setRestoreUserName(user.name);
    setRestoreDialogOpen(true);
  };

  const confirmRestore = async () => {
    if (!restoreUserId) return;

    try {
      const result = await restoreMutation.mutateAsync(restoreUserId);
      setRestoreResult(result);
      setRestoreDialogOpen(false);
      setPasswordDialogOpen(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || '복구에 실패했습니다.');
    }
  };

  const handleCopyPassword = () => {
    if (restoreResult?.temporaryPassword) {
      navigator.clipboard.writeText(restoreResult.temporaryPassword);
      toast.success('임시 비밀번호가 복사되었습니다.');
    }
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setRestoreResult(null);
    setRestoreUserId(null);
    setRestoreUserName('');
  };

  const handleSleepClick = async (user: DeletedFemale) => {
    const ok = await confirmAction({
      title: '재탈퇴 처리',
      message: `${user.name}님을 다시 탈퇴 처리하시겠습니까?`,
    });
    if (!ok) return;

    try {
      await sleepMutation.mutateAsync(user.id);
      toast.success('재탈퇴 처리되었습니다.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || '재탈퇴 처리에 실패했습니다.');
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

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          [리텐션] 파묘
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          탈퇴한 여성 회원을 조회하고 복구할 수 있습니다.
        </Typography>
      </Box>

      {error && (
        <Typography color="error" sx={{ mb: 2 }}>
          {(error as any).message || '목록을 불러오는데 실패했습니다.'}
        </Typography>
      )}

      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          총 {totalCount}명의 탈퇴 회원
        </Typography>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : females.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">탈퇴한 여성 회원이 없습니다.</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>탈퇴일시</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {females.map((female) => (
                  <TableRow key={female.id}>
                    <TableCell>{female.name}</TableCell>
                    <TableCell>{female.email || '-'}</TableCell>
                    <TableCell>{female.phoneNumber}</TableCell>
                    <TableCell>{formatDate(female.deletedAt)}</TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          onClick={() => handleRestoreClick(female)}
                          disabled={restoreMutation.isPending}
                        >
                          복구
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          onClick={() => handleSleepClick(female)}
                          disabled={sleepMutation.isPending}
                        >
                          재탈퇴
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      <Dialog open={restoreDialogOpen} onClose={() => setRestoreDialogOpen(false)}>
        <DialogTitle>회원 복구</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{restoreUserName}</strong>님을 복구하시겠습니까?
            <br />
            <br />
            복구 시 다음과 같은 작업이 수행됩니다:
            <br />
            • 임시 비밀번호가 발급됩니다
            <br />
            • 기존 푸시 토큰이 삭제됩니다
            <br />• isRetentionUser가 true로 설정됩니다
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialogOpen(false)} disabled={restoreMutation.isPending}>
            취소
          </Button>
          <Button
            onClick={confirmRestore}
            color="primary"
            variant="contained"
            disabled={restoreMutation.isPending}
          >
            {restoreMutation.isPending ? <CircularProgress size={20} /> : '복구'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
        <DialogTitle>회원 복구 완료</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            회원이 성공적으로 복구되었습니다.
            <br />
            아래 임시 비밀번호를 회원에게 전달해주세요.
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              label="임시 비밀번호"
              value={restoreResult?.temporaryPassword || ''}
              InputProps={{
                readOnly: true,
              }}
            />
            <IconButton onClick={handleCopyPassword} color="primary">
              <ContentCopyIcon />
            </IconButton>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            이메일: {restoreResult?.email}
            <br />
            복구 시간: {restoreResult?.restoredAt ? formatDate(restoreResult.restoredAt) : '-'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function DeletedFemalesPageV2() {
  return <DeletedFemalesPageContent />;
}
