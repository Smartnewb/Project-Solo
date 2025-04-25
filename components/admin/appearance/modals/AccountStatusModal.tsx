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
                  ? '사용자에게 알림이 전송됩니다.' 
                  : '활성화 상태로 변경 시 사유는 선택사항입니다.'
              }
            />
            
            {status === 'SUSPENDED' && (
              <Typography color="error" variant="body2" sx={{ mt: 2 }}>
                주의: 계정 정지는 사용자가 앱에 로그인할 수 없게 됩니다.
              </Typography>
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
          disabled={loading || success}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '처리 중...' : '변경하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountStatusModal;
