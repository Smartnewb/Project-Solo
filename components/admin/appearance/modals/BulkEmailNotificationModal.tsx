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
  IconButton,
  LinearProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AdminService from '@/app/services/admin';

interface BulkEmailNotificationModalProps {
  open: boolean;
  onClose: () => void;
  userIds: string[];
  onSuccess?: () => void;
}

const BulkEmailNotificationModal: React.FC<BulkEmailNotificationModalProps> = ({
  open,
  onClose,
  userIds,
  onSuccess
}) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);
  const [sentEmails, setSentEmails] = useState(0);

  const handleSubmit = async () => {
    if (userIds.length === 0 || !subject.trim() || !message.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setProgress(0);
      setTotalEmails(userIds.length);
      setSentEmails(0);
      
      // 각 사용자에게 이메일 발송
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < userIds.length; i++) {
        const userId = userIds[i];
        try {
          await AdminService.userAppearance.sendEmailNotification(userId, subject, message);
          successCount++;
        } catch (err) {
          console.error(`사용자 ${userId}에게 이메일 발송 실패:`, err);
          failCount++;
        }
        
        // 진행 상태 업데이트
        setSentEmails(i + 1);
        setProgress(Math.round(((i + 1) / userIds.length) * 100));
      }
      
      // 결과 메시지 설정
      if (failCount === 0) {
        setSuccess(true);
      } else {
        setError(`${userIds.length}명 중 ${successCount}명에게 이메일을 발송했습니다. ${failCount}명 발송 실패.`);
      }
      
      if (onSuccess) onSuccess();
      
      // 성공 후 3초 후에 모달 닫기
      if (failCount === 0) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (error: any) {
      setError(error.message || '이메일 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSubject('');
      setMessage('');
      setError(null);
      setSuccess(false);
      setProgress(0);
      setTotalEmails(0);
      setSentEmails(0);
      onClose();
    }
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
        <Typography variant="h6">일괄 이메일 발송</Typography>
        <IconButton edge="end" color="inherit" onClick={handleClose} aria-label="close" disabled={loading}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              수신자
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
              선택된 사용자 {userIds.length}명
            </Typography>
          </Box>

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

          {loading && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">발송 진행 중...</Typography>
                <Typography variant="body2">{sentEmails}/{totalEmails}</Typography>
              </Box>
              <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {userIds.length}명의 사용자에게 이메일이 성공적으로 발송되었습니다.
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

export default BulkEmailNotificationModal;
