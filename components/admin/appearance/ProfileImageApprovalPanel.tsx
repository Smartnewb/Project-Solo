'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Stack,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import AdminService from '@/app/services/admin';
import UserDetailModal from './UserDetailModal';

// 프로필 이미지 승인 대기 사용자 타입
interface PendingProfileImageUser {
  userId: string;
  userName: string;
  images: Array<{
    id: string;
    imageUrl: string;
    imageOrder: number;
    isMain: boolean;
  }>;
  createdAt: string;
}

const ProfileImageApprovalPanel: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const [pendingUsers, setPendingUsers] = useState<PendingProfileImageUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 사용자 상세 정보 모달 관련 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 승인/거절 모달 관련 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 이미지 확대 모달 관련 상태
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>('');

  // 거절 사유 템플릿
  const rejectionReasons = [
    { value: 'PROFILE_PHOTO_SELF', label: '본인 사진으로 프로필을 변경해주세요' },
    { value: 'PROFILE_PHOTO_CLEAR_FACE', label: '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_NATURAL', label: '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_FORMAT_UNSUPPORTED', label: '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)' },
    { value: 'OTHER', label: '기타 (직접 입력)' }
  ];

  // 거절 사유 한글 표시 함수
  const getRejectionReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'PROFILE_PHOTO_CLEAR_FACE': '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요',
      'PROFILE_PHOTO_SELF': '본인 사진으로 프로필을 변경해주세요',
      'PROFILE_PHOTO_NATURAL': '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요',
      'PROFILE_PHOTO_FORMAT_UNSUPPORTED': '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)'
    };
    return reasonMap[reason] || reason;
  };

  // 심사 대기 중인 프로필 이미지 목록 조회
  const fetchPendingProfileImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await AdminService.profileImages.getPendingProfileImages();
      setPendingUsers(response || []);
    } catch (error: any) {
      console.error('심사 대기 중인 프로필 이미지 목록 조회 오류:', error);
      setError(error.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 상세 정보 조회
  const fetchUserDetail = async (userId: string) => {
    try {
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setSelectedUserId(userId);
      
      const response = await AdminService.userAppearance.getUserDetails(userId);
      setUserDetail(response);
      setUserDetailModalOpen(true);
    } catch (error: any) {
      console.error('사용자 상세 정보 조회 오류:', error);
      setUserDetailError(error.message || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 프로필 이미지 승인
  const handleApprove = async () => {
    if (!selectedUserId) return;
    
    try {
      setActionLoading(true);
      await AdminService.profileImages.approveProfileImage(selectedUserId);
      
      // 목록 새로고침
      await fetchPendingProfileImages();
      setApprovalModalOpen(false);
      setSelectedUserId(null);
    } catch (error: any) {
      console.error('프로필 이미지 승인 오류:', error);
      setError(error.message || '승인 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 프로필 이미지 거절
  const handleReject = async () => {
    if (!selectedUserId || !rejectionReason.trim()) return;

    try {
      setActionLoading(true);

      const finalRejectionReason = rejectionReason === 'OTHER'
        ? customRejectionReason.trim()
        : getRejectionReasonLabel(rejectionReason);

      await AdminService.profileImages.rejectProfileImage(selectedUserId, finalRejectionReason);

      // 목록 새로고침
      await fetchPendingProfileImages();
      setRejectionModalOpen(false);
      setSelectedUserId(null);
      setRejectionReason('');
      setCustomRejectionReason('');
    } catch (error: any) {
      console.error('프로필 이미지 거절 오류:', error);
      setError(error.message || '거절 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageModalOpen(true);
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    fetchPendingProfileImages();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        프로필 이미지 승인 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <Stack spacing={2}>
          {pendingUsers.length === 0 ? (
            <Typography align="center" sx={{ p: 3 }}>
              심사 대기 중인 프로필 이미지가 없습니다.
            </Typography>
          ) : (
            pendingUsers.map((user) => (
              <Card key={user.userId}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="subtitle1"
                        fontWeight="bold"
                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => fetchUserDetail(user.userId)}
                      >
                        {user.userName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Box>
                  </Box>
                  
                  {/* 이미지 목록 */}
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto' }}>
                    {user.images.map((image) => (
                      <Box key={image.id} sx={{ position: 'relative', flexShrink: 0 }}>
                        <Avatar
                          src={image.imageUrl}
                          sx={{
                            width: 60,
                            height: 60,
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                          }}
                          variant="rounded"
                          onClick={() => handleImageClick(image.imageUrl)}
                        />
                        {image.isMain && (
                          <Chip
                            label="대표"
                            size="small"
                            color="primary"
                            sx={{ position: 'absolute', top: -8, right: -8, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>
                    ))}
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => fetchUserDetail(user.userId)}
                    >
                      상세보기
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setApprovalModalOpen(true);
                      }}
                    >
                      승인
                    </Button>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setSelectedUserId(user.userId);
                        setRejectionModalOpen(true);
                      }}
                    >
                      거절
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      ) : (
        /* 데스크톱: 테이블 레이아웃 */
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>사용자</TableCell>
                <TableCell>승인 대기 프로필 이미지</TableCell>
                <TableCell>신청일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    심사 대기 중인 프로필 이미지가 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                pendingUsers.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <Typography
                        sx={{ cursor: 'pointer', color: 'primary.main' }}
                        onClick={() => fetchUserDetail(user.userId)}
                      >
                        {user.userName}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {user.images.map((image) => (
                          <Box key={image.id} sx={{ position: 'relative' }}>
                            <Avatar
                              src={image.imageUrl}
                              sx={{
                                width: 50,
                                height: 50,
                                cursor: 'pointer',
                                '&:hover': { opacity: 0.8 }
                              }}
                              variant="rounded"
                              onClick={() => handleImageClick(image.imageUrl)}
                            />
                            {image.isMain && (
                              <Chip
                                label="대표"
                                size="small"
                                color="primary"
                                sx={{ position: 'absolute', top: -8, right: -8, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => fetchUserDetail(user.userId)}
                        >
                          상세보기
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedUserId(user.userId);
                            setApprovalModalOpen(true);
                          }}
                        >
                          승인
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          onClick={() => {
                            setSelectedUserId(user.userId);
                            setRejectionModalOpen(true);
                          }}
                        >
                          거절
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* 승인 확인 모달 */}
      <Dialog open={approvalModalOpen} onClose={() => setApprovalModalOpen(false)}>
        <DialogTitle>프로필 이미지 승인</DialogTitle>
        <DialogContent>
          <Typography>
            선택한 사용자의 프로필 이미지를 승인하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalModalOpen(false)}>취소</Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="primary"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={20} /> : '승인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거절 모달 */}
      <Dialog open={rejectionModalOpen} onClose={() => setRejectionModalOpen(false)}>
        <DialogTitle>프로필 이미지 거절</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            거절 사유를 선택해주세요.
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>거절 사유</InputLabel>
            <Select
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setCustomRejectionReason('');
                }
              }}
              label="거절 사유"
            >
              {rejectionReasons.map((reason, index) => (
                <MenuItem key={index} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {rejectionReason === 'OTHER' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <TextField
                label="기타 거절 사유"
                multiline
                rows={3}
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                placeholder="거절 사유를 직접 입력해주세요"
                required
              />
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionModalOpen(false)}>취소</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={actionLoading || !rejectionReason.trim() || (rejectionReason === 'OTHER' && !customRejectionReason.trim())}
          >
            {actionLoading ? <CircularProgress size={20} /> : '거절'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 이미지 확대 모달 */}
      <Dialog
        open={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center' }}>
          <img
            src={selectedImageUrl}
            alt="프로필 이미지"
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageModalOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 상세 정보 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => selectedUserId && fetchUserDetail(selectedUserId)}
        />
      )}
    </Box>
  );
};

export default ProfileImageApprovalPanel;
