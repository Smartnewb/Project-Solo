import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  CircularProgress,
  Alert,
  Typography
} from '@mui/material';
import WarningIcon from '@mui/icons-material/Warning';
import AdminService from '@/app/services/admin';

interface WarningMessageModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const WarningMessageModal: React.FC<WarningMessageModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!userId || !message.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      await AdminService.userAppearance.sendWarningMessage(userId, message);
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || '경고 메시지 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage('');
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <WarningIcon color="warning" sx={{ mr: 1 }} />
          경고 메시지 발송
        </Box>
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            경고 메시지가 성공적으로 발송되었습니다.
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              사용자에게 경고 메시지를 발송합니다. 이 메시지는 사용자의 앱 내 알림으로 전송됩니다.
            </Typography>
            
            <TextField
              fullWidth
              label="경고 메시지"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="경고 메시지 내용을 입력하세요"
              error={message.trim() === ''}
              helperText={message.trim() === '' ? '메시지를 입력해주세요' : ''}
              required
            />
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
          color="warning" 
          disabled={loading || success || message.trim() === ''}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '발송 중...' : '발송하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WarningMessageModal;
