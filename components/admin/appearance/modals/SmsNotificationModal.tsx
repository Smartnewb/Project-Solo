import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AdminService from '@/app/services/admin';

interface SmsNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  phoneNumber?: string;
  userName?: string;
  onSuccess?: () => void;
}

const SmsNotificationModal: React.FC<SmsNotificationModalProps> = ({
  open,
  onClose,
  userId,
  phoneNumber,
  userName,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [charCount, setCharCount] = useState(0);
  
  const MAX_CHAR_COUNT = 90; // SMS 최대 글자수 제한

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    setCharCount(newMessage.length);
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!userId || !message.trim()) {
      setError('메시지 내용을 입력해주세요.');
      return;
    }

    if (message.length > MAX_CHAR_COUNT) {
      setError(`메시지는 ${MAX_CHAR_COUNT}자를 초과할 수 없습니다.`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await AdminService.userAppearance.sendSmsNotification(userId, message);
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || 'SMS 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessage('');
    setError(null);
    setSuccess(false);
    setCharCount(0);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">SMS 발송</Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {phoneNumber && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                수신자
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userName ? `${userName} (${phoneNumber})` : phoneNumber}
              </Typography>
            </Box>
          )}

          <TextField
            label="메시지"
            fullWidth
            multiline
            rows={4}
            value={message}
            onChange={handleMessageChange}
            margin="normal"
            variant="outlined"
            disabled={loading}
            placeholder="SMS 내용을 입력하세요"
            InputLabelProps={{ shrink: true }}
            error={charCount > MAX_CHAR_COUNT}
            helperText={`${charCount}/${MAX_CHAR_COUNT}자 ${charCount > MAX_CHAR_COUNT ? '(글자 수 초과)' : ''}`}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              SMS가 성공적으로 발송되었습니다.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={handleClose}
          color="inherit"
          disabled={loading}
          sx={{ borderRadius: 2 }}
        >
          취소
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={loading || !message.trim() || charCount > MAX_CHAR_COUNT}
          sx={{ borderRadius: 2, position: 'relative' }}
        >
          {loading ? (
            <>
              <CircularProgress size={24} sx={{ color: 'white', position: 'absolute' }} />
              <span style={{ opacity: 0 }}>발송하기</span>
            </>
          ) : (
            '발송하기'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SmsNotificationModal;
