'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Dialog } from '@mui/material';
import AdminService from '@/app/services/admin';
import UserTableList from './components/UserTableList';
import ImageReviewPanel from './components/ImageReviewPanel';
import RejectReasonModal from './components/RejectReasonModal';

export interface PendingProfileImage {
  id: string;
  imageUrl: string;
  imageOrder: number;
  isMain: boolean;
  createdAt?: string;
}

export interface PendingImage {
  id: string;
  imageUrl: string;
  imageOrder: number;
  isMain: boolean;
}

export interface RejectionHistory {
  category: string;
  reason: string;
  createdAt: string;
}

export interface PreferenceOption {
  typeName: string;
  options: string[];
}

export interface PendingUser {
  // 필수 필드 (API 응답에서 항상 존재)
  userId: string;
  profileId: string;
  userName: string;
  age: number;
  gender: 'male' | 'female';
  isApproved: boolean;
  approved: boolean;
  pendingImages: PendingImage[];
  approvedImageUrls: string[];
  createdAt: string;

  // 선택적 필드
  email?: string;
  phone?: string;
  universityName?: string;
  department?: string;
  mbti?: string;
  bio?: string;
  preferences?: PreferenceOption[];
  rejectionHistory?: RejectionHistory[];

  // UI용 추가 필드 (하위 호환성)
  id?: string;
  name?: string;
  profileImageUrls?: string[];
  profileImages?: PendingProfileImage[];
  phoneNumber?: string;
  birthday?: string | null;
  university?: string | null;
  region?: string | null;
  profileImageUrl?: string | null;
  status?: string;
  statusAt?: string | null;
  instagram?: string;
  instagramId?: string | null;
  instagramUrl?: string | null;
  appearanceGrade?: string;
  rejectionReason?: string | null;
  signupRoute?: string | null;
}

export interface PendingUsersResponse {
  users: PendingUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export default function ProfileReviewPage() {
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [currentRejectUserId, setCurrentRejectUserId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    hasMore: false
  });

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const extractImageIdFromUrl = (url: string): string => {
    const matches = url.match(/\/([0-9a-f-]+)\.(jpg|jpeg|png|gif|webp)$/i);
    return matches ? matches[1] : `url-${url.split('/').pop()?.split('.')[0] || 'unknown'}`;
  };

  const fetchPendingUsers = async (page: number = 1) => {
    try {
      setLoading(true);
      setError(null);

      console.log('심사 대기 유저 목록 조회 시작... (page:', page, ')');
      const response: PendingUsersResponse = await AdminService.userReview.getPendingUsers(page);

      console.log('API 응답 데이터:', response);

      if (!response || !response.users) {
        throw new Error('API 응답 형식이 올바르지 않습니다. users 배열이 없습니다.');
      }

      // 응답 데이터 정규화 (UI 호환성을 위한 추가 필드)
      const normalizedUsers: PendingUser[] = response.users.map(user => {
        // 전체 이미지 URL 목록 (승인된 이미지 + 대기 중인 이미지)
        const allImageUrls = [
          ...(user.approvedImageUrls || []),
          ...(user.pendingImages || []).map(img => img.imageUrl)
        ];

        return {
          ...user,
          // UI 호환성을 위한 추가 필드
          id: user.userId,
          name: user.userName,
          profileImages: user.pendingImages,
          profileImageUrls: allImageUrls,
          // 기본값 설정
          preferences: user.preferences || [],
          rejectionHistory: user.rejectionHistory || []
        };
      });

      console.log('정규화된 사용자 데이터:', normalizedUsers);

      setUsers(normalizedUsers);
      setPagination(response.pagination);
      return normalizedUsers;
    } catch (err: any) {
      console.error('심사 대기 목록 조회 중 오류:', err);
      console.error('오류 메시지:', err.message);
      console.error('오류 스택:', err.stack);
      console.error('HTTP 응답:', err.response);
      console.error('HTTP 상태:', err.response?.status);
      console.error('응답 데이터:', err.response?.data);

      // 401 에러 처리 (인증 실패)
      if (err.response?.status === 401) {
        console.error('인증 오류 발생 - 로그인이 필요합니다.');
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
        // axios interceptor가 자동으로 refresh를 시도하고 실패하면 로그인 페이지로 리다이렉트됩니다.
        return [];
      }

      const errorMessage = err.response?.data?.message
        || err.message
        || '심사 대기 목록을 불러오는 중 오류가 발생했습니다.';

      setError(`${errorMessage} (상태코드: ${err.response?.status || 'N/A'})`);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: PendingUser) => {
    // 새로운 API 응답에는 이미 모든 정보가 포함되어 있음
    setSelectedUser(user);
  };

  const handleApproveUser = async (userId: string) => {
    try {
      setProcessing(true);
      await AdminService.userReview.approveUser(userId);
      const updatedData = await fetchPendingUsers();

      if (selectedUser?.id === userId || selectedUser?.userId === userId) {
        const updatedUser = updatedData.find((u: PendingUser) => u.id === userId || u.userId === userId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        } else {
          setSelectedUser(null);
        }
      }
    } catch (err: any) {
      console.error('유저 승인 중 오류:', err);
      setError(err.response?.data?.message || '유저 승인 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectUser = (userId: string) => {
    setCurrentRejectUserId(userId);
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async (category: string, reason: string) => {
    if (!currentRejectUserId) return;

    try {
      setProcessing(true);
      setRejectModalOpen(false);
      await AdminService.userReview.rejectUser(currentRejectUserId, category, reason);
      const updatedData = await fetchPendingUsers();

      if (selectedUser?.id === currentRejectUserId || selectedUser?.userId === currentRejectUserId) {
        const updatedUser = updatedData.find((u: PendingUser) => u.id === currentRejectUserId || u.userId === currentRejectUserId);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        } else {
          setSelectedUser(null);
        }
      }

      setCurrentRejectUserId(null);
    } catch (err: any) {
      console.error('유저 반려 중 오류:', err);
      setError(err.response?.data?.message || '유저 반려 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>심사 대기 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        회원 적격 심사
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, height: 'calc(100vh - 200px)' }}>
        <Box sx={{ flex: '7', overflow: 'auto' }}>
          <UserTableList
            users={users}
            selectedUser={selectedUser}
            onUserSelect={handleUserSelect}
            pagination={pagination}
            onPageChange={(page) => fetchPendingUsers(page)}
          />
        </Box>

        <Box sx={{ flex: '3', overflow: 'auto' }}>
          <ImageReviewPanel
            user={selectedUser}
            onApprove={handleApproveUser}
            onReject={handleRejectUser}
            onRefresh={fetchPendingUsers}
          />
        </Box>
      </Box>

      <RejectReasonModal
        open={rejectModalOpen}
        onClose={() => {
          setRejectModalOpen(false);
          setCurrentRejectUserId(null);
        }}
        onConfirm={handleRejectConfirm}
      />

      <Dialog
        open={processing}
        PaperProps={{
          sx: {
            backgroundColor: 'transparent',
            boxShadow: 'none',
            overflow: 'hidden'
          }
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            p: 4,
            backgroundColor: 'white',
            borderRadius: 2,
            minWidth: 200
          }}
        >
          <CircularProgress size={60} />
          <Typography sx={{ mt: 2, fontWeight: 600 }}>
            처리 중입니다...
          </Typography>
        </Box>
      </Dialog>
    </Box>
  );
}
