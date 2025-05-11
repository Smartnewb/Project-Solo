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

interface EmailNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userEmail?: string;
  userName?: string;
  onSuccess?: () => void;
}

const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  open,
  onClose,
  userId,
  userEmail,
  userName,
  onSuccess
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!userId || !subject.trim() || !message.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await AdminService.userAppearance.sendEmailNotification(userId, subject, message);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || '이메일 공지사항 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSubject('');
    setMessage('');
    setError(null);
    setSuccess(false);
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
        <Typography variant="h6">이메일 발송</Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          {userEmail && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary">
                수신자
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                {userName ? `${userName} (${userEmail})` : userEmail}
              </Typography>
            </Box>
          )}

          <TextField
            label="제목"
            fullWidth
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            margin="normal"
            variant="outlined"
            disabled={loading}
            placeholder="이메일 제목을 입력하세요"
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            label="내용"
            fullWidth
            multiline
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            margin="normal"
            variant="outlined"
            disabled={loading}
            placeholder="이메일 내용을 입력하세요"
            InputLabelProps={{ shrink: true }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              이메일이 성공적으로 발송되었습니다.
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
          disabled={loading || !subject.trim() || !message.trim()}
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

export default EmailNotificationModal;
