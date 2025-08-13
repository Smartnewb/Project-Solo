'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Avatar,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider
} from '@mui/material';
import AdminService from '@/app/services/admin';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import RegionFilter, { useRegionFilter } from '@/components/admin/common/RegionFilter';

interface BlacklistUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  suspendedAt: string;
  region?: string;
  profile?: {
    profileImages?: Array<{
      url: string;
      isMain: boolean;
    }>;
  };
}

interface BlacklistUsersResponse {
  users: BlacklistUser[];
  totalCount: number;
}

const BlacklistUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<BlacklistUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [releaseLoading, setReleaseLoading] = useState<string | null>(null);

  // 지역 필터 훅 사용
  const { region, setRegion: setRegionFilter, getRegionParam } = useRegionFilter();
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: BlacklistUser | null;
  }>({
    open: false,
    user: null
  });

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const fetchBlacklistUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: BlacklistUsersResponse = await AdminService.userAppearance.getBlacklistUsers(getRegionParam());
      setUsers(response.users || []);
    } catch (err: any) {
      console.error('블랙리스트 사용자 목록 조회 중 오류:', err);
      setError(err.message ?? '블랙리스트 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklistUsers();
  }, [region]);

  const handleOpenUserDetailModal = async (userId: string) => {
    try {
      setSelectedUserId(userId);
      setUserDetailModalOpen(true);
      setLoadingUserDetail(true);
      setUserDetailError(null);
      setUserDetail(null);

      console.log('유저 상세 정보 조회 요청:', userId);
      const data = await AdminService.userAppearance.getUserDetails(userId);
      console.log('유저 상세 정보 응답:', data);

      setUserDetail(data);
    } catch (error: any) {
      console.error('유저 상세 정보 조회 중 오류:', error);
      setUserDetailError(error.message ?? '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  const handleOpenReleaseDialog = (user: BlacklistUser) => {
    setConfirmDialog({
      open: true,
      user
    });
  };

  const handleCloseReleaseDialog = () => {
    setConfirmDialog({
      open: false,
      user: null
    });
  };

  const handleReleaseFromBlacklist = async () => {
    if (!confirmDialog.user) return;

    try {
      setReleaseLoading(confirmDialog.user.id);

      await AdminService.userAppearance.releaseFromBlacklist(confirmDialog.user.id);

      setUsers(prev => prev.filter(user => user.id !== confirmDialog.user!.id));

      handleCloseReleaseDialog();
    } catch (err: any) {
      console.error('블랙리스트 해제 중 오류:', err);
      setError(err.message ?? '블랙리스트 해제 중 오류가 발생했습니다.');
    } finally {
      setReleaseLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProfileImageUrl = (user: BlacklistUser) => {
    const mainImage = user.profile?.profileImages?.find(img => img.isMain);
    return mainImage?.url || undefined;
  };

  const getRegionLabel = (region?: string) => {
    const regionMap: Record<string, string> = {
      'DJN': '대전',
      'SJG': '세종',
      'CJU': '청주',
      'BSN': '부산',
      'DGU': '대구',
      'GJJ': '공주'
    };
    return region ? regionMap[region] || region : '-';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          블랙리스트 사용자 ({users.length}명)
        </Typography>
        <Button
          variant="outlined"
          onClick={fetchBlacklistUsers}
          disabled={loading}
        >
          새로고침
        </Button>
      </Box>

      {/* 지역 필터 */}
      <Box sx={{ mb: 3 }}>
        <RegionFilter
          value={region}
          onChange={setRegionFilter}
          size="small"
          sx={{ minWidth: 150 }}
        />
      </Box>

      {users.length === 0 ? (
        <Alert severity="info">
          블랙리스트에 등록된 사용자가 없습니다.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={user.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid #f44336',
                  backgroundColor: '#ffebee'
                }}
              >
                <CardContent sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Avatar
                      src={getProfileImageUrl(user)}
                      sx={{
                        width: 80,
                        height: 80,
                        mb: 2,
                        border: '3px solid #f44336',
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 0 0 2px #3f51b5'
                        }
                      }}
                      onClick={() => handleOpenUserDetailModal(user.id)}
                    >
                      {user.name?.charAt(0) ?? '?'}
                    </Avatar>

                    <Typography variant="h6" gutterBottom>
                      {user.name}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {user.email}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {user.phoneNumber}
                    </Typography>

                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      지역: {getRegionLabel(user.region)}
                    </Typography>

                    <Divider sx={{ width: '100%', my: 2 }} />

                    <Chip
                      label="블랙리스트"
                      color="error"
                      sx={{ mb: 2 }}
                    />

                    <Typography variant="caption" color="textSecondary" gutterBottom>
                      등록일: {formatDate(user.suspendedAt)}
                    </Typography>

                    <Box sx={{ mt: 2, width: '100%' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => handleOpenReleaseDialog(user)}
                        disabled={releaseLoading === user.id}
                      >
                        {releaseLoading === user.id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          '블랙리스트 해제'
                        )}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* 블랙리스트 해제 확인 다이얼로그 */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseReleaseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>블랙리스트 해제 확인</DialogTitle>
        <DialogContent>
          <Typography>
            <strong>{confirmDialog.user?.name}</strong> 사용자를 블랙리스트에서 해제하시겠습니까?
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            해제 후 해당 사용자는 다시 서비스를 이용할 수 있게 됩니다.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReleaseDialog}>
            취소
          </Button>
          <Button
            onClick={handleReleaseFromBlacklist}
            variant="contained"
            color="primary"
            disabled={releaseLoading !== null}
          >
            {releaseLoading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              '해제'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 유저 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            fetchBlacklistUsers();
          }}
        />
      )}
    </Box>
  );
};

export default BlacklistUsersPanel;
