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
  Typography,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminService from '@/app/services/admin';

interface ProfileUpdateRequestModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onSuccess?: () => void;
}

const ProfileUpdateRequestModal: React.FC<ProfileUpdateRequestModalProps> = ({
  open,
  onClose,
  userId,
  onSuccess
}) => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [useTemplate, setUseTemplate] = useState(false);

  const handleUseTemplate = () => {
    setUseTemplate(!useTemplate);
    if (!useTemplate) {
      setMessage('프로필 사진 또는 정보를 업데이트해 주세요. 더 나은 매칭 서비스를 위해 최신 정보가 필요합니다.');
    }
  };

  const handleSubmit = async () => {
    if (!userId || !message.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      await AdminService.userAppearance.sendProfileUpdateRequest(userId, message);
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || '프로필 수정 요청 발송 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMessage('');
      setError(null);
      setSuccess(false);
      setUseTemplate(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon color="primary" sx={{ mr: 1 }} />
          프로필 수정 요청
        </Box>
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            프로필 수정 요청이 성공적으로 발송되었습니다.
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body2" sx={{ mb: 2 }}>
              사용자에게 프로필 수정을 요청합니다. 이 메시지는 사용자의 앱 내 알림으로 전송됩니다.
            </Typography>
            
            <FormControlLabel
              control={
                <Checkbox 
                  checked={useTemplate} 
                  onChange={handleUseTemplate}
                  disabled={loading}
                />
              }
              label="기본 템플릿 사용"
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="요청 메시지"
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={loading}
              placeholder="프로필 수정 요청 내용을 입력하세요"
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
          color="primary" 
          disabled={loading || success || message.trim() === ''}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '발송 중...' : '발송하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProfileUpdateRequestModal;
