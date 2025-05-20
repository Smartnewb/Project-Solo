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
  // 문자열의 바이트 수 계산 함수 (한글: 2바이트, 영어/숫자/공백/특수문자: 1바이트)
  const getByteLength = (str: string): number => {
    let byte = 0;
    for (let i = 0; i < str.length; i++) {
      // 한글 체크 (유니코드 범위: AC00-D7A3, 가-힣)
      const charCode = str.charCodeAt(i);
      if (charCode >= 0xAC00 && charCode <= 0xD7A3) {
        byte += 2; // 한글은 2바이트
      } else {
        byte += 1; // 그 외 문자는 1바이트
      }
    }
    return byte;
  };

  const [byteCount, setByteCount] = useState(0);

  const MAX_USER_INPUT_BYTE = 69; // 사용자가 입력할 수 있는 최대 바이트 (기본 템플릿 제외)
  const SMS_PREFIX = "[web발신]\n[썸타임]\n"; // SMS 기본 템플릿

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMessage = e.target.value;
    const messageByte = getByteLength(newMessage);
    setByteCount(messageByte);
    setMessage(newMessage);
  };

  const handleSubmit = async () => {
    if (!userId || !message.trim()) {
      setError('메시지 내용을 입력해주세요.');
      return;
    }

    if (byteCount > MAX_USER_INPUT_BYTE) {
      setError(`메시지는 ${MAX_USER_INPUT_BYTE}바이트를 초과할 수 없습니다. (현재: ${byteCount}바이트)`);
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
    setByteCount(0);
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
            error={byteCount > MAX_USER_INPUT_BYTE}
            helperText={`${byteCount}/${MAX_USER_INPUT_BYTE}바이트 (한글: 2바이트, 영어/숫자/공백: 1바이트)`}
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
          disabled={loading || !message.trim() || byteCount > MAX_USER_INPUT_BYTE}
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
