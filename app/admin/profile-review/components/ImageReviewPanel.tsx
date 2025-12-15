import { useState } from 'react';
import { Paper, Typography, Box, Button, IconButton, Dialog, Chip, Divider, TextField, Link } from '@mui/material';
import { PendingUser } from '../page';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InstagramIcon from '@mui/icons-material/Instagram';
import AdminService from '@/app/services/admin';

interface ImageReviewPanelProps {
  user: PendingUser | null;
  onApprove: (userId: string) => void;
  onReject: (userId: string) => void;
  onRefresh: () => void;
}

export default function ImageReviewPanel({
  user,
  onApprove,
  onReject,
  onRefresh
}: ImageReviewPanelProps) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [rejectImageModalOpen, setRejectImageModalOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [imageRejectionReason, setImageRejectionReason] = useState('');

  if (!user) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center', height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          심사할 사용자를 선택해주세요.
        </Typography>
      </Paper>
    );
  }

  const handleApprove = () => {
    onApprove(user.id);
  };

  const handleReject = () => {
    onReject(user.id);
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  const handleImageModalClose = () => {
    setImageModalOpen(false);
    setSelectedImageUrl(null);
  };

  const handleApproveImage = async (imageId: string) => {
    try {
      await AdminService.profileImages.approveIndividualImage(imageId);
      onRefresh();
    } catch (error: any) {
      console.error('개별 이미지 승인 중 오류:', error);
      alert(error.response?.data?.message || '이미지 승인 중 오류가 발생했습니다.');
    }
  };

  const handleRejectImageClick = (imageId: string) => {
    setSelectedImageId(imageId);
    setRejectImageModalOpen(true);
  };

  const handleRejectImageConfirm = async () => {
    if (!selectedImageId) return;

    if (!imageRejectionReason.trim()) {
      alert('거절 사유를 입력해주세요.');
      return;
    }

    try {
      await AdminService.profileImages.rejectIndividualImage(selectedImageId, imageRejectionReason);
      setRejectImageModalOpen(false);
      setSelectedImageId(null);
      setImageRejectionReason('');
      onRefresh();
    } catch (error: any) {
      console.error('개별 이미지 거절 중 오류:', error);
      alert(error.response?.data?.message || '이미지 거절 중 오류가 발생했습니다.');
    }
  };

  const handleRejectImageModalClose = () => {
    setRejectImageModalOpen(false);
    setSelectedImageId(null);
    setImageRejectionReason('');
  };

  return (
    <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
      {/* 유저 정보 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {user.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
          <Chip label={`${user.age}세`} size="small" />
          <Chip label={user.gender === 'male' ? '남성' : '여성'} size="small" />
          <Chip label={user.mbti || 'MBTI 미입력'} size="small" color={user.mbti ? 'primary' : 'default'} />
        </Box>
        {(user.universityName || user.department) && (
          <Typography variant="body2" color="text.secondary">
            {user.universityName || '대학 미입력'} · {user.department || '학과 미입력'}
          </Typography>
        )}
        {user.instagram && (
          <Link
            href={user.instagram.startsWith('http') ? user.instagram : `https://instagram.com/${user.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
              color: '#E1306C',
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            <InstagramIcon fontSize="small" />
            <Typography variant="body2">
              {user.instagram.replace('https://instagram.com/', '@').replace('https://www.instagram.com/', '@')}
            </Typography>
          </Link>
        )}
        {user.bio && (
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            "{user.bio}"
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* 선호도 */}
      {user.preferences && user.preferences.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            선호도
          </Typography>
          {(user.preferences || []).map((pref, index) => (
            <Box key={index} sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {pref.typeName}
              </Typography>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                {pref.options.map((option, idx) => (
                  <Chip key={idx} label={option} size="small" variant="outlined" />
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* 거절 이력 */}
      {user.rejectionHistory && user.rejectionHistory.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'error.main' }}>
            거절 이력
          </Typography>
          {(user.rejectionHistory || []).map((history, index) => (
            <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#fff3e0', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                {history.category}
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {history.reason}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(history.createdAt).toLocaleString()}
              </Typography>
            </Box>
          ))}
        </Box>
      )}

      {/* 프로필 이미지 */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
          심사 대기 사진 ({user.pendingImages?.length || user.profileImages?.length || 0}장)
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}
        >
          {(user.pendingImages || user.profileImages || []).map((image, index) => (
            <Box
              key={image.id}
              sx={{
                position: 'relative',
                borderRadius: 2,
                overflow: 'visible',
                backgroundColor: '#E0E0E0',
                width: '100%',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            >
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '75%',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  borderRadius: 2,
                  '&:hover': {
                    transform: 'scale(1.02)',
                    transition: 'transform 0.2s'
                  }
                }}
                onClick={() => handleImageClick(image.imageUrl)}
              >
                <Box
                  component="img"
                  src={image.imageUrl}
                  alt={`프로필 이미지 ${index + 1}`}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />

                <Box
                  sx={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1.5,
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#fff',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    backdropFilter: 'blur(4px)'
                  }}
                >
                  사진 {index + 1}
                </Box>

                {/* 우측 하단 X, V 버튼 */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 12,
                    right: 12,
                    display: 'flex',
                    gap: 1,
                    pointerEvents: 'auto'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    size="small"
                    onClick={() => handleRejectImageClick(image.id)}
                    sx={{
                      backgroundColor: 'rgba(244, 67, 54, 0.9)',
                      color: '#fff',
                      width: 40,
                      height: 40,
                      '&:hover': {
                        backgroundColor: 'rgba(211, 47, 47, 1)'
                      }
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleApproveImage(image.id)}
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.9)',
                      color: '#fff',
                      width: 40,
                      height: 40,
                      '&:hover': {
                        backgroundColor: 'rgba(56, 142, 60, 1)'
                      }
                    }}
                  >
                    <CheckCircleIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 승인/거절 버튼 */}
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Button
          variant="outlined"
          color="error"
          fullWidth
          onClick={handleReject}
          sx={{ height: 48 }}
        >
          반려하기
        </Button>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleApprove}
          sx={{ height: 48 }}
        >
          승인하기
        </Button>
      </Box>

      {/* 이미지 확대 모달 */}
      <Dialog
        open={imageModalOpen}
        onClose={handleImageModalClose}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'visible',
            maxWidth: '95vw',
            maxHeight: '95vh',
            m: 2
          }
        }}
      >
        <Box
          sx={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          <IconButton
            onClick={handleImageModalClose}
            sx={{
              position: 'absolute',
              top: -20,
              right: -20,
              backgroundColor: 'white',
              color: '#333',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
          {selectedImageUrl && (
            <Box
              component="img"
              src={selectedImageUrl}
              alt="확대 이미지"
              sx={{
                maxWidth: '90vw',
                maxHeight: '90vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                borderRadius: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
              }}
            />
          )}
        </Box>
      </Dialog>

      {/* 개별 이미지 거절 사유 입력 모달 */}
      <Dialog open={rejectImageModalOpen} onClose={handleRejectImageModalClose} maxWidth="md" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, fontWeight: 700 }}>
            이미지 거절 사유 선택
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            해당 이미지를 거절하는 사유를 선택하거나 입력해주세요.
          </Typography>

          {/* 빠른 템플릿 선택 */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ mb: 1.5, fontWeight: 600, color: 'primary.main' }}>
              ⚡ 빠른 선택
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {[
                '얼굴 식별 불가',
                '화질 불량',
                '부적절한 노출',
                '타인 사진 도용'
              ].map((template) => (
                <Chip
                  key={template}
                  label={template}
                  onClick={() => setImageRejectionReason(template)}
                  color={imageRejectionReason === template ? 'error' : 'default'}
                  variant={imageRejectionReason === template ? 'filled' : 'outlined'}
                  sx={{
                    cursor: 'pointer',
                    fontWeight: imageRejectionReason === template ? 600 : 400,
                    px: 1.5,
                    '&:hover': {
                      backgroundColor: imageRejectionReason === template ? undefined : '#ffebee'
                    }
                  }}
                />
              ))}
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              카테고리별 사유
            </Typography>
          </Divider>

          {/* 카테고리별 템플릿 */}
          <Box sx={{ mb: 3 }}>
            {/* 프로필 이미지 문제 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                📷 프로필 이미지 문제
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  '본인 사진 아님',
                  '얼굴 가림',
                  '과도한 보정',
                  '단체 사진',
                  '풍경/사물 사진',
                  '어린 시절 사진'
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={imageRejectionReason === template ? 'error' : 'default'}
                    variant={imageRejectionReason === template ? 'filled' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: imageRejectionReason === template ? undefined : '#ffebee' }
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 품질 문제 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                🔍 품질 문제
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  '흐릿한 사진',
                  '너무 어두움',
                  '해상도 낮음',
                  '필터 과다'
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={imageRejectionReason === template ? 'error' : 'default'}
                    variant={imageRejectionReason === template ? 'filled' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: imageRejectionReason === template ? undefined : '#ffebee' }
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 부적절한 내용 */}
            <Box sx={{ mb: 2.5 }}>
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                ⚠️ 부적절한 내용
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  '선정적인 포즈',
                  '음주/흡연 장면',
                  '폭력적 내용',
                  '혐오 표현 포함'
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={imageRejectionReason === template ? 'error' : 'default'}
                    variant={imageRejectionReason === template ? 'filled' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: imageRejectionReason === template ? undefined : '#ffebee' }
                    }}
                  />
                ))}
              </Box>
            </Box>

            {/* 신원 확인 불가 */}
            <Box>
              <Typography variant="caption" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary', display: 'block' }}>
                🔐 신원 확인 불가
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  '연예인/유명인 사진',
                  '인터넷 이미지 도용',
                  'AI 생성 이미지'
                ].map((template) => (
                  <Chip
                    key={template}
                    label={template}
                    size="small"
                    onClick={() => setImageRejectionReason(template)}
                    color={imageRejectionReason === template ? 'error' : 'default'}
                    variant={imageRejectionReason === template ? 'filled' : 'outlined'}
                    sx={{
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      '&:hover': { backgroundColor: imageRejectionReason === template ? undefined : '#ffebee' }
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ mb: 3 }}>
            <Typography variant="caption" color="text.secondary">
              또는 직접 입력
            </Typography>
          </Divider>

          {/* 직접 입력 */}
          <TextField
            fullWidth
            multiline
            rows={4}
            value={imageRejectionReason}
            onChange={(e) => setImageRejectionReason(e.target.value)}
            placeholder="거절 사유를 자세히 입력해주세요..."
            sx={{ mb: 3 }}
          />

          <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
            <Button onClick={handleRejectImageModalClose} color="inherit" size="large">
              취소
            </Button>
            <Button onClick={handleRejectImageConfirm} variant="contained" color="error" size="large">
              거절하기
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Paper>
  );
}
