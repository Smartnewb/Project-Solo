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
  Grid
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
    email: '',
    phoneNumber: '',
    instagramId: '',
    mbti: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // 유저 정보로 폼 초기화
  useEffect(() => {
    if (userDetail) {
      // DB 데이터 로깅
      console.log('사용자 상세 정보 로드:', userDetail);

      setFormData({
        name: userDetail.name || '',
        email: userDetail.email || '',
        phoneNumber: userDetail.phoneNumber || '',
        instagramId: userDetail.instagramId || '',
        mbti: userDetail.mbti || ''
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

      // API 스키마에 맞게 데이터 구성
      // 제공된 API 문서에 따라 필요한 필드만 포함
      const profileData = {
        userId: userId,
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        instagramId: formData.instagramId || '',
        mbti: formData.mbti || ''
      };

      console.log('프로필 업데이트 요청 데이터:', profileData);

      // 실제 API 호출
      const response = await AdminService.userAppearance.updateUserProfile(userId, profileData);
      console.log('프로필 업데이트 응답:', response);

      setSuccess(true);
      if (onSuccess) onSuccess();

      // 성공 후 1초 후에 모달 닫기
      setTimeout(() => {
        handleClose();
      }, 1000);
    } catch (error: any) {
      console.error('프로필 수정 오류:', error);
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
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
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

            <Grid container spacing={2}>
              {/* 이름 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="이름"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </Grid>

              {/* 이메일 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="이메일"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  type="email"
                />
              </Grid>

              {/* 전화번호 */}
              <Grid item xs={12}>
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

              {/* 인스타그램 ID */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="인스타그램 ID"
                  name="instagramId"
                  value={formData.instagramId}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="@instagram_id"
                />
              </Grid>

              {/* MBTI */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="MBTI"
                  name="mbti"
                  value={formData.mbti}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="ENFP"
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
