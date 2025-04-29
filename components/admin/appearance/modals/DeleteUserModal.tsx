import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import AdminService from '@/app/services/admin';

interface DeleteUserModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName?: string;
  onSuccess?: () => void;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  open,
  onClose,
  userId,
  userName,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!reason.trim()) {
      setError('삭제 사유를 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('계정 삭제 요청 시작:', { userId, reason });
      await AdminService.userAppearance.deleteUser(userId, reason);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error('계정 삭제 중 오류:', error);
      console.error('오류 상세 정보:', error.response?.data || error.message);
      console.error('오류 상태 코드:', error.response?.status);

      // 오류 메시지 설정
      let errorMessage = '계정 삭제 중 오류가 발생했습니다.';

      // 서버에서 오류 메시지가 있는 경우 사용
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // 500 에러인 경우 더 자세한 메시지 제공
      if (error.response?.status === 500) {
        errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setReason('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>계정 삭제</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            계정이 성공적으로 삭제되었습니다.
            <Typography variant="body2" sx={{ mt: 1 }}>
              사용자에게 계정 삭제 알림 이메일이 발송되었습니다.
            </Typography>
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography variant="body1" color="error" sx={{ mb: 2 }}>
              주의: 이 작업은 되돌릴 수 없습니다. 사용자 계정이 삭제됩니다.
            </Typography>
            {userName && (
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{userName}</strong> 사용자의 계정을 삭제하시겠습니까?
              </Typography>
            )}
            <TextField
              autoFocus
              margin="dense"
              id="reason"
              label="삭제 사유"
              type="text"
              fullWidth
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              disabled={loading}
              placeholder="사용자에게 전송될 삭제 사유를 입력해주세요."
              helperText="이 내용은 사용자에게 이메일로 전송됩니다."
            />
          </Box>
        )}
      </DialogContent>
      {!success && (
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            취소
          </Button>
          <Button
            onClick={handleSubmit}
            color="error"
            variant="contained"
            disabled={loading || !reason.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : null}
          >
            계정 삭제
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default DeleteUserModal;
