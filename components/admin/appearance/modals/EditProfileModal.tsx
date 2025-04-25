import React, { useState, useEffect } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminService from '@/app/services/admin';
import { UserDetail } from '../UserDetailModal';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  userDetail: UserDetail | null;
  onSuccess?: () => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  open,
  onClose,
  userId,
  userDetail,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    phoneNumber: '',
    instagramId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 유저 정보로 폼 초기화
  useEffect(() => {
    if (userDetail) {
      setFormData({
        name: userDetail.name || '',
        age: userDetail.age ? String(userDetail.age) : '',
        gender: userDetail.gender || '',
        phoneNumber: userDetail.phoneNumber || '',
        instagramId: userDetail.instagramId || ''
      });
    }
  }, [userDetail]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);
      
      // 숫자 필드 변환
      const profileData = {
        ...formData,
        age: formData.age ? parseInt(formData.age, 10) : undefined
      };
      
      await AdminService.userAppearance.updateUserProfile(userId, profileData);
      
      setSuccess(true);
      if (onSuccess) onSuccess();
      
      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      setError(error.message || '프로필 수정 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSuccess(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <EditIcon color="primary" sx={{ mr: 1 }} />
          프로필 직접 수정
        </Box>
      </DialogTitle>
      <DialogContent>
        {success ? (
          <Alert severity="success" sx={{ mt: 2 }}>
            프로필이 성공적으로 수정되었습니다.
          </Alert>
        ) : (
          <Box sx={{ pt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="body2" sx={{ mb: 3 }}>
              사용자의 프로필 정보를 직접 수정합니다. 이 작업은 즉시 반영됩니다.
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="나이"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  disabled={loading}
                  inputProps={{ min: 18, max: 100 }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="gender-label">성별</InputLabel>
                  <Select
                    labelId="gender-label"
                    name="gender"
                    value={formData.gender}
                    label="성별"
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <MenuItem value="MALE">남성</MenuItem>
                    <MenuItem value="FEMALE">여성</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="전화번호"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="010-1234-5678"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="인스타그램 ID"
                  name="instagramId"
                  value={formData.instagramId}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="instagram_id"
                />
              </Grid>
            </Grid>
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
          disabled={loading || success || !formData.name}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? '저장 중...' : '저장하기'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditProfileModal;
