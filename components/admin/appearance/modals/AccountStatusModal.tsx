import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import AdminService from '@/app/services/admin';

interface AccountStatusModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

type AccountStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

const AccountStatusModal: React.FC<AccountStatusModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess
}) => {
  const [status, setStatus] = useState<AccountStatus>('ACTIVE');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      await AdminService.userAppearance.updateAccountStatus(userId, status, reason);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || '계정 상태 변경 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setStatus('ACTIVE');
      setReason('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>계정 상태 변경</DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            계정 상태가 성공적으로 변경되었습니다.
            {status !== 'ACTIVE' && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                사용자에게 상태 변경 알림 이메일이 발송되었습니다.
              </Typography>
            )}
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="account-status-label">계정 상태</InputLabel>
              <Select
                labelId="account-status-label"
                value={status}
                label="계정 상태"
                onChange={(e) => setStatus(e.target.value as AccountStatus)}
                disabled={loading}
              >
                <MenuItem value="ACTIVE">활성화</MenuItem>
                <MenuItem value="INACTIVE">비활성화</MenuItem>
                <MenuItem value="SUSPENDED">정지</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="사유"
              multiline
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={loading}
              placeholder="상태 변경 사유를 입력하세요"
              helperText={
                status !== 'ACTIVE'
                  ? '사용자에게 이메일로 계정 상태 변경 알림과 사유가 전송됩니다.'
                  : '활성화 상태로 변경 시 사유는 선택사항입니다.'
              }
              required={status !== 'ACTIVE'}
              error={status !== 'ACTIVE' && !reason.trim()}
            />

            {status !== 'ACTIVE' && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 'medium', color: 'primary.main' }}>
                  <strong>이메일 알림 안내</strong>
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  계정 상태 변경 시 사용자에게 다음 정보가 포함된 이메일이 자동으로 발송됩니다:
                </Typography>
                <ul style={{ margin: '0', paddingLeft: '20px' }}>
                  <li>
                    <Typography variant="body2">변경된 계정 상태 ({status === 'INACTIVE' ? '비활성화' : '정지'})</Typography>
                  </li>
                  <li>
                    <Typography variant="body2">상태 변경 사유 (위에 입력한 내용)</Typography>
                  </li>
                  <li>
                    <Typography variant="body2">변경 일시</Typography>
                  </li>
                </ul>
                {status === 'SUSPENDED' && (
                  <Typography color="error" variant="body2" sx={{ mt: 1, fontWeight: 'medium' }}>
                    주의: 계정 정지는 사용자가 앱에 로그인할 수 없게 됩니다.
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || success || (status !== 'ACTIVE' && !reason.trim())}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '처리 중...' : '변경하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountStatusModal;
