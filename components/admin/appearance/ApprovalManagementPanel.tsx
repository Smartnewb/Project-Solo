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
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import axiosServer from '@/utils/axios';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import RegionFilter, { useRegionFilter } from '@/components/admin/common/RegionFilter';

interface PendingUser {
  id?: string;
  userId?: string;
  name: string;
  phone?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  instagramId?: string;
  instagramUrl?: string;
  university?: string;
  region?: string;
  createdAt: string;
  status: 'pending' | 'rejected';
  rejectionReason?: string;
}



const ApprovalManagementPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0); // 0: pending, 1: rejected, 2: reapply
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<PendingUser[]>([]);
  const [reapplyUsers, setReapplyUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);
  const [reapplyCount, setReapplyCount] = useState(0);

  // 지역 필터 훅 사용
  const { region, setRegion: setRegionFilter, getRegionParam } = useRegionFilter();

  // 승인/거부 모달 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // 거부 사유 옵션들
  const rejectionReasons = [
    '프로필 사진을 본인 사진으로 수정',
    '프로필 사진이 얼굴이 잘 보이지 않음',
    '프로필 사진이 상대방에게 불쾌함을 줄 수 있는 사진이 포함되어 있어 수정이 필요',
    '프로필 이미지 오류(jpg,jpeg,png 지원)',
    '인스타 ID 오류',
    '인스타 ID 본계정이 아님',
    '프로필 사진과 인스타 ID 모두 수정이 필요'
  ];
  const [processing, setProcessing] = useState(false);

  // 사용자 상세 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const limit = 10;

  // 사용자 ID 가져오기 헬퍼 함수
  const getUserId = (user: PendingUser): string => {
    return user.id || user.userId || '';
  };

  // 사용자 전화번호 가져오기 헬퍼 함수
  const getUserPhone = (user: PendingUser): string => {
    return user.phone || user.phoneNumber || '';
  };

  // 지역 한글 표시 함수
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

  // 탭 변경 핸들러
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1);
  };

  // 지역 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [region]);

  // 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [activeTab, page, region]);



  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      let currentEndpoint = '';
      let otherEndpoints: string[] = [];

      if (activeTab === 0) {
        currentEndpoint = '/admin/users/approval/pending';
        otherEndpoints = ['/admin/users/approval/rejected', '/admin/users/approval/reapply'];
      } else if (activeTab === 1) {
        currentEndpoint = '/admin/users/approval/rejected';
        otherEndpoints = ['/admin/users/approval/pending', '/admin/users/approval/reapply'];
      } else if (activeTab === 2) {
        currentEndpoint = '/admin/users/approval/reapply';
        otherEndpoints = ['/admin/users/approval/pending', '/admin/users/approval/rejected'];
      }

      // 지역 파라미터 추가
      const regionParam = getRegionParam();
      const currentParams = { page, limit, ...(regionParam && { region: regionParam }) };
      const otherParams = { page: 1, limit: 10, ...(regionParam && { region: regionParam }) };

      const [currentResponse, ...otherResponses] = await Promise.all([
        axiosServer.get(currentEndpoint, { params: currentParams }),
        ...otherEndpoints.map(endpoint => axiosServer.get(endpoint, { params: otherParams }))
      ]);

      const users = currentResponse.data.items || [];
      const currentMeta = currentResponse.data.meta || {};

      if (activeTab === 0) {
        setPendingUsers(users);
        setPendingCount(currentMeta.totalItems || users.length);
        setRejectedCount(otherResponses[0]?.data?.meta?.totalItems || 0);
        setReapplyCount(otherResponses[1]?.data?.meta?.totalItems || 0);
      } else if (activeTab === 1) {
        setRejectedUsers(users);
        setRejectedCount(currentMeta.totalItems || users.length);
        setPendingCount(otherResponses[0]?.data?.meta?.totalItems || 0);
        setReapplyCount(otherResponses[1]?.data?.meta?.totalItems || 0);
      } else {
        setReapplyUsers(users);
        setReapplyCount(currentMeta.totalItems || users.length);
        setPendingCount(otherResponses[0]?.data?.meta?.totalItems || 0);
        setRejectedCount(otherResponses[1]?.data?.meta?.totalItems || 0);
      }

      setTotalPages(currentMeta.totalPages || Math.ceil((currentMeta.totalItems || users.length) / limit));
    } catch (err: any) {
      console.error('승인 대기 사용자 조회 오류:', err);
      setError('사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 상세 정보 조회
  const fetchUserDetail = async (userId: string) => {
    setLoadingUserDetail(true);
    setUserDetailError(null);

    try {
      const response = await axiosServer.get(`/admin/users/detail/${userId}`);
      const userData = response.data;

      // API 응답 데이터를 UserDetail 형식에 맞게 변환
      const userDetail: UserDetail = {
        id: userData.id || userData.userId,
        name: userData.name,
        age: userData.age,
        gender: userData.gender,
        profileImages: userData.profileImages || [],
        profileImageUrl: userData.profileImageUrl,
        phoneNumber: userData.phoneNumber || userData.phone,
        instagramId: userData.instagramId,
        instagramUrl: userData.instagramUrl,
        university: userData.university,
        email: userData.email,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
        lastActiveAt: userData.lastActiveAt,
        appearanceGrade: userData.appearanceGrade,
        accountStatus: userData.accountStatus,
        ...userData // 기타 필드들
      };

      setUserDetail(userDetail);
      setUserDetailModalOpen(true);
    } catch (err: any) {
      console.error('사용자 상세 정보 조회 오류:', err);
      setUserDetailError('사용자 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 승인 처리
  const handleApproval = async () => {
    if (!selectedUserId) return;

    setProcessing(true);
    try {
      await axiosServer.patch(`/admin/users/approval/${selectedUserId}/status`, {
        status: 'approved'
      });

      setApprovalModalOpen(false);
      setSelectedUserId(null);
      fetchUsers(); // 목록 및 카운트 새로고침
    } catch (err: any) {
      console.error('승인 처리 오류:', err);
      setError('승인 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  // 거부 처리
  const handleRejection = async () => {
    if (!selectedUserId || !rejectionReason.trim()) return;

    setProcessing(true);
    try {
      await axiosServer.patch(`/admin/users/approval/${selectedUserId}/status`, {
        status: 'rejected',
        rejectionReason: rejectionReason.trim()
      });

      setRejectionModalOpen(false);
      setSelectedUserId(null);
      setRejectionReason('');
      fetchUsers(); // 목록 및 카운트 새로고침
    } catch (err: any) {
      console.error('거부 처리 오류:', err);
      setError('거부 처리 중 오류가 발생했습니다.');
    } finally {
      setProcessing(false);
    }
  };

  const currentUsers = activeTab === 0 ? pendingUsers : activeTab === 1 ? rejectedUsers : reapplyUsers;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        회원가입 승인 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 지역 필터 */}
      <Box sx={{ mb: 3 }}>
        <RegionFilter
          value={region}
          onChange={setRegionFilter}
          size="small"
          sx={{ minWidth: 150 }}
        />
      </Box>

      {/* 탭 메뉴 */}
      <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label={`승인 대기 (${pendingCount})`} />
        <Tab label={`승인 거부 (${rejectedCount})`} />
        <Tab label={`재심사 요청 (${reapplyCount})`} />
      </Tabs>

      {/* 사용자 목록 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>프로필</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>인스타그램 ID</TableCell>
              <TableCell>대학교</TableCell>
              <TableCell>지역</TableCell>
              <TableCell>가입일</TableCell>
              <TableCell>상태</TableCell>
              {(activeTab === 1 || activeTab === 2) && <TableCell>거부 사유</TableCell>}
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={(activeTab === 1 || activeTab === 2) ? 10 : 9} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : currentUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(activeTab === 1 || activeTab === 2) ? 10 : 9} align="center">
                  {activeTab === 0 ? '승인 대기 중인 사용자가 없습니다.' :
                   activeTab === 1 ? '승인 거부된 사용자가 없습니다.' :
                   '재심사 요청한 사용자가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              currentUsers.map((user) => (
                <TableRow key={getUserId(user)}>
                  <TableCell>
                    <Avatar
                      src={user.profileImageUrl}
                      alt={user.name}
                      sx={{ width: 40, height: 40, cursor: 'pointer' }}
                      onClick={() => fetchUserDetail(getUserId(user))}
                    />
                  </TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{getUserPhone(user)}</TableCell>
                  <TableCell>
                    {user.instagramId ? (
                      <Link
                        href={user.instagramUrl || `https://www.instagram.com/${user.instagramId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          textDecoration: 'none',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {user.instagramId}
                      </Link>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {user.university || '-'}
                  </TableCell>
                  <TableCell>
                    {getRegionLabel(user.region)}
                  </TableCell>
                  <TableCell>
                    {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        user.status === 'pending' ?
                          (user.rejectionReason === 'reapply' ? '재심사 요청' : '승인 대기') :
                          '승인 거부'
                      }
                      color={
                        user.status === 'pending' ?
                          (user.rejectionReason === 'reapply' ? 'info' : 'warning') :
                          'error'
                      }
                      size="small"
                    />
                  </TableCell>
                  {(activeTab === 1 || activeTab === 2) && (
                    <TableCell>
                      {user.rejectionReason === 'reapply' ? '재심사 요청' : user.rejectionReason || '-'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => fetchUserDetail(getUserId(user))}
                      >
                        상세보기
                      </Button>
                      {(user.status === 'pending' && user.rejectionReason !== 'reapply') && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              setSelectedUserId(getUserId(user));
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
                              setSelectedUserId(getUserId(user));
                              setRejectionModalOpen(true);
                            }}
                          >
                            거부
                          </Button>
                        </>
                      )}
                      {(user.status === 'pending' && user.rejectionReason === 'reapply') && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => {
                              setSelectedUserId(getUserId(user));
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
                              setSelectedUserId(getUserId(user));
                              setRejectionModalOpen(true);
                            }}
                          >
                            거부
                          </Button>
                        </>
                      )}
                      {user.status === 'rejected' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedUserId(getUserId(user));
                            setApprovalModalOpen(true);
                          }}
                        >
                          승인
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* 승인 확인 모달 */}
      <Dialog open={approvalModalOpen} onClose={() => setApprovalModalOpen(false)}>
        <DialogTitle>회원가입 승인</DialogTitle>
        <DialogContent>
          <Typography>
            선택한 사용자의 회원가입을 승인하시겠습니까?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setApprovalModalOpen(false)}>취소</Button>
          <Button
            onClick={handleApproval}
            variant="contained"
            color="primary"
            disabled={processing}
          >
            {processing ? <CircularProgress size={20} /> : '승인'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 거부 사유 입력 모달 */}
      <Dialog open={rejectionModalOpen} onClose={() => setRejectionModalOpen(false)}>
        <DialogTitle>회원가입 거부</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            거부 사유를 선택해주세요.
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>거부 사유</InputLabel>
            <Select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              label="거부 사유"
            >
              {rejectionReasons.map((reason, index) => (
                <MenuItem key={index} value={reason}>
                  {reason}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionModalOpen(false)}>취소</Button>
          <Button
            onClick={handleRejection}
            variant="contained"
            color="error"
            disabled={processing || !rejectionReason.trim()}
          >
            {processing ? <CircularProgress size={20} /> : '거부'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 상세 정보 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={() => setUserDetailModalOpen(false)}
          userId={userDetail.id}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => fetchUserDetail(userDetail.id)}
          showApprovalActions={true}
          onApproval={() => {
            setSelectedUserId(userDetail.id);
            setApprovalModalOpen(true);
            setUserDetailModalOpen(false);
          }}
          onRejection={() => {
            setSelectedUserId(userDetail.id);
            setRejectionModalOpen(true);
            setUserDetailModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default ApprovalManagementPanel;
