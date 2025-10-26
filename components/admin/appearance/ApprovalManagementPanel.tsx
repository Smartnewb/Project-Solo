'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  useMediaQuery,
  useTheme,
  Stack,
  IconButton,
  Card,
  CardContent,
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
  TextField,
  Pagination,
  Tabs,
  Tab,
  Link
} from '@mui/material';
import axiosServer from '@/utils/axios';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import RegionFilter, { useRegionFilter } from '@/components/admin/common/RegionFilter';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import AdminService from '@/app/services/admin';

interface PendingUser {
  id?: string;
  userId?: string;
  name: string;
  age?: number;
  birthday?: string;
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
  lastPushNotificationAt?: string;
  signupRoute?: 'PASS' | 'KAKAO' | 'APPLE';
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

  // 모바일 감지 훅
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // 지역 필터 훅 사용
  const { region, setRegion: setRegionFilter, getRegionParam } = useRegionFilter();

  // 이름 검색 상태
  const [nameSearch, setNameSearch] = useState<string>('');

  // 승인/거부 모달 상태
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customRejectionReason, setCustomRejectionReason] = useState('');

  // 거부 사유 옵션들
  const rejectionReasons = [
    // 장기 미접속
    { value: 'LONG_TERM_INACTIVE_REAPPLY', label: '[장기 미접속]-재심사를 요청해주세요' },

    // 프로필 사진 관련
    { value: 'PROFILE_PHOTO_CLEAR_FACE', label: '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_SELF', label: '본인 사진으로 프로필을 변경해주세요' },
    { value: 'PROFILE_PHOTO_NATURAL', label: '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요' },
    { value: 'PROFILE_PHOTO_FORMAT_UNSUPPORTED', label: '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)' },

    // 인스타그램 ID 관련
    { value: 'INSTAGRAM_ID_CORRECT', label: '인스타그램 ID를 정확히 입력해주세요' },
    { value: 'INSTAGRAM_ID_MAIN_ACCOUNT', label: '인스타그램 본계정으로 변경해주세요' },
    { value: 'INSTAGRAM_ID_PUBLIC', label: '인스타그램을 공개계정으로 설정해주세요' },
    { value: 'INSTAGRAM_ID_ACTIVE', label: '활동 내역이 있는 인스타그램 계정으로 변경해주세요' },
    { value: 'INSTAGRAM_ID_VERIFIABLE', label: '본인 확인이 가능한 인스타그램 계정으로 변경해주세요' },

    // 복합 사유
    { value: 'BOTH_PROFILE_AND_INSTAGRAM', label: '프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요' },

    // 이용 조건 관련
    { value: 'NOT_ELIGIBLE', label: '현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다' },
    { value: 'FOREIGN_STUDENT_NOT_ACCEPTED', label: '죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다' },

    // 신뢰성 검증 관련
    { value: 'IDENTITY_VERIFICATION_DIFFICULT', label: '본인 확인이 어려워 승인이 어렵습니다' },
    { value: 'RELIABLE_PROFILE_REQUIRED', label: '신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요' },

    // 기타
    { value: 'OTHER', label: '기타 (직접 입력)' }
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
      'GJJ': '공주',
      'GHE': '김해',
      'ICN': '인천',
      'SEL': '서울',
      'KYG': '경기',
      'CAN': '천안',
      'GWJ': '광주'
    };
    return region ? regionMap[region] || region : '-';
  };

  // 회원가입 루트 한글 표시 함수
  const getSignupRouteLabel = (signupRoute?: string) => {
    const routeMap: Record<string, string> = {
      'PASS': 'PASS',
      'KAKAO': '카카오',
      'APPLE': '애플'
    };
    return signupRoute ? routeMap[signupRoute] || signupRoute : '-';
  };

  // 거절 사유 한글 표시 함수
  const getRejectionReasonLabel = (reason?: string) => {
    const reasonMap: Record<string, string> = {
      'PROFILE_PHOTO_CLEAR_FACE': '프로필 사진을 본인 얼굴이 잘 보이는 사진으로 변경해주세요',
      'PROFILE_PHOTO_SELF': '본인 사진으로 프로필을 변경해주세요',
      'PROFILE_PHOTO_NATURAL': '상대방이 봐도 부담스럽지 않은 자연스러운 사진으로 변경해주세요',
      'PROFILE_PHOTO_FORMAT_UNSUPPORTED': '프로필 이미지 형식 지원 안함(jpg, jpeg, png 지원)',
      'INSTAGRAM_ID_CORRECT': '인스타그램 ID를 정확히 입력해주세요',
      'INSTAGRAM_ID_MAIN_ACCOUNT': '인스타그램 본계정으로 변경해주세요',
      'INSTAGRAM_ID_PUBLIC': '인스타그램을 공개계정으로 설정해주세요',
      'INSTAGRAM_ID_ACTIVE': '활동 내역이 있는 인스타그램 계정으로 변경해주세요',
      'INSTAGRAM_ID_VERIFIABLE': '본인 확인이 가능한 인스타그램 계정으로 변경해주세요',
      'BOTH_PROFILE_AND_INSTAGRAM': '프로필 사진과 인스타그램 ID 모두 수정 후 재신청해주세요',
      'NOT_ELIGIBLE': '현재 썸타임 이용 조건에 맞지 않아 승인이 어렵습니다',
      'LONG_TERM_INACTIVE_REAPPLY': '[장기 미접속]-재심사를 요청해주세요',
      'FOREIGN_STUDENT_NOT_ACCEPTED': '죄송하지만 현재 외국인 유학생 회원가입을 받고 있지 않습니다',
      'IDENTITY_VERIFICATION_DIFFICULT': '본인 확인이 어려워 승인이 어렵습니다',
      'RELIABLE_PROFILE_REQUIRED': '신뢰할 수 있는 프로필 정보로 수정 후 재신청해주세요',
      'OTHER': '기타',
      'reapply': '재심사 요청'
    };
    return reason ? reasonMap[reason] || reason : '-';
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

  // 이름 검색 변경 시 페이지 초기화
  useEffect(() => {
    setPage(1);
  }, [nameSearch]);

  // 데이터 로드
  useEffect(() => {
    fetchUsers();
  }, [activeTab, page, region, nameSearch]);



  const fetchUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      const regionParam = getRegionParam();

      // 현재 탭에 따라 적절한 API 호출
      const [currentResponse, pendingResponse, rejectedResponse, reapplyResponse] = await Promise.all([
        // 현재 탭 데이터
        activeTab === 0
          ? AdminService.userAppearance.getPendingUsers(page, limit, regionParam, nameSearch || undefined)
          : activeTab === 1
          ? AdminService.userAppearance.getRejectedUsers(page, limit, regionParam, nameSearch || undefined)
          : AdminService.userAppearance.getReapplyUsers(page, limit, regionParam, nameSearch || undefined),

        // 다른 탭들의 카운트를 위한 데이터 (첫 페이지만)
        activeTab !== 0 ? AdminService.userAppearance.getPendingUsers(1, 10, regionParam, nameSearch || undefined) : null,
        activeTab !== 1 ? AdminService.userAppearance.getRejectedUsers(1, 10, regionParam, nameSearch || undefined) : null,
        activeTab !== 2 ? AdminService.userAppearance.getReapplyUsers(1, 10, regionParam, nameSearch || undefined) : null
      ]);

      const users = currentResponse.items || [];
      const currentMeta = currentResponse.meta || {};

      // 현재 탭 데이터 설정
      if (activeTab === 0) {
        setPendingUsers(users);
        setPendingCount(currentMeta.totalItems || users.length);
      } else if (activeTab === 1) {
        setRejectedUsers(users);
        setRejectedCount(currentMeta.totalItems || users.length);
      } else {
        setReapplyUsers(users);
        setReapplyCount(currentMeta.totalItems || users.length);
      }

      // 다른 탭들의 카운트 설정
      if (pendingResponse && activeTab !== 0) {
        setPendingCount(pendingResponse.meta?.totalItems || 0);
      }
      if (rejectedResponse && activeTab !== 1) {
        setRejectedCount(rejectedResponse.meta?.totalItems || 0);
      }
      if (reapplyResponse && activeTab !== 2) {
        setReapplyCount(reapplyResponse.meta?.totalItems || 0);
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
        birthday: userData.birthday,
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

    // 기타 사유인 경우 customRejectionReason이 필요
    if (rejectionReason === 'OTHER' && !customRejectionReason.trim()) return;

    setProcessing(true);
    try {
      const finalRejectionReason = rejectionReason === 'OTHER'
        ? customRejectionReason.trim()
        : getRejectionReasonLabel(rejectionReason);

      await axiosServer.patch(`/admin/users/approval/${selectedUserId}/status`, {
        status: 'rejected',
        rejectionReason: finalRejectionReason
      });

      setRejectionModalOpen(false);
      setSelectedUserId(null);
      setRejectionReason('');
      setCustomRejectionReason('');
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
      <Typography 
        variant={isMobile ? 'h6' : 'h5'} 
        gutterBottom
        sx={{
          fontSize: {
            xs: '1.1rem',
            sm: '1.25rem',
            md: '1.5rem',
          }
        }}
      >

        회원가입 승인 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 필터 영역 */}
      <Box sx={{
        mb: 3,
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2,
        alignItems: { xs: 'stretch', sm: 'center' }
      }}>
        {/* 지역 필터 */}
        <RegionFilter
          value={region}
          onChange={setRegionFilter}
          size={isMobile ? 'medium' : 'small'}
          sx={{ minWidth: { xs: '100%', sm: 150}, }}
        />

        {/* 이름 검색 */}
        <TextField
          label="이름 검색"
          value={nameSearch}
          onChange={(e) => setNameSearch(e.target.value)}
          size={isMobile ? 'medium' : 'small'}
          sx={{ minWidth: { xs: '100%', sm: 200} }}
          placeholder="사용자 이름을 입력하세요"
        />
      </Box>

      {/* 탭 메뉴 */}
      <Tabs 
        value={activeTab}
        onChange={handleTabChange}
        sx={{ mb: 2 }}
        variant={isMobile ? 'scrollable' : 'standard'}
        scrollButtons={isMobile ? 'auto' : false}
        allowScrollButtonsMobile
      >
        <Tab label={isMobile ? `대기 (${pendingCount})` : `승인 대기 (${pendingCount})`} />
        <Tab label={isMobile ? `거부 (${rejectedCount})` : `승인 거부 (${rejectedCount})`} />
        <Tab label={isMobile ? `재심사 (${reapplyCount})` : `재심사 요청 (${reapplyCount})`} />
      </Tabs>
      {/* MARK: - 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <Stack spacing={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3}}>
              <CircularProgress />
            </Box>
          ) : currentUsers.length === 0 ? (
            <Typography align='center' sx={{ p: 3}}>
            </Typography>
          ) : (
            currentUsers.map((user) => (
              <Card key={getUserId(user)} sx={{ width: '100%'}}>
                {/* 수직 레이아웃 */}
                <CardContent> 
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2}}>
                    <Avatar
                      src={user.profileImageUrl}
                      alt={user.name}
                      sx={{
                        width: 50,
                        height: 50,
                        mr: 2,
                      }}
                      onClick={() => fetchUserDetail(getUserId(user))}
                    />

                    <Box sx={{ flex: 1}}>
                      <Typography variant='subtitle1' fontWeight='bold'>{user.name}</Typography>
                      <Typography variant='caption' color='text.secondary'>
                        {user.birthday ? (
                          <>
                            생년월일: {new Date(user.birthday).toLocaleDateString('ko-KR')}
                            {user.age && ` (${user.age}세)`}
                          </>
                        ) : (
                          user.age ? `나이: ${user.age}세` : ''
                        )}
                      </Typography>
                      <Typography variant='caption' color='text.secondary' sx={{ display: 'block' }}>
                        가입일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </Typography>
                    </Box>

                    {/*TODO: - 상태 라벨 및 색상 지정 */}

                  </Box>

                

                  <Stack spacing={1} sx={{ mb: 2}}>
                    <Typography>{getUserPhone(user)}</Typography>
                    <Typography>{user.instagramId || '-'}</Typography>
                    <Typography>{user.university || '-'}</Typography>
                    <Typography>{getRegionLabel(user.region)}</Typography>
                    <Typography>가입 루트: {getSignupRouteLabel(user.signupRoute)}</Typography>
                    {(activeTab === 1 || activeTab ===2) && user.rejectionReason && (
                      <Typography>거부 사유 : {getRejectionReasonLabel(user.rejectionReason)}</Typography>
                    )}
                  </Stack>

                  <Box sx={{
                    display: 'flex',
                    gap: 1,
                    justifyContent: 'flex-end',
                  }}>
                    <IconButton>
                    </IconButton>

                    <IconButton size='small' color='success' onClick={() => {
                      setSelectedUserId(getUserId(user));
                      setApprovalModalOpen(true);
                    }}> 
                          <CheckIcon />
                      </IconButton>

                    {(user.status === 'pending') && (
                      <>
                        <IconButton size='small' color='error' onClick={() => {
                          setSelectedUserId(getUserId(user));
                          setRejectionModalOpen(true);
                        }}> 
                          <CloseIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))
          )}
        </Stack>
      ) : (
        <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>프로필</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>생년월일(나이)</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>인스타그램 ID</TableCell>
              <TableCell>대학교</TableCell>
              <TableCell>지역</TableCell>
              <TableCell>가입일</TableCell>
              <TableCell>회원가입 루트</TableCell>
              <TableCell>상태</TableCell>
              {(activeTab === 1 || activeTab === 2) && <TableCell>거부 사유</TableCell>}
              <TableCell>마지막 알림 발송</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={(activeTab === 1 || activeTab === 2) ? 13 : 12} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : currentUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={(activeTab === 1 || activeTab === 2) ? 13 : 12} align="center">
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
                  <TableCell>
                    {user.birthday ? (
                      <>
                        {new Date(user.birthday).toLocaleDateString('ko-KR')}
                        {user.age && ` (${user.age}세)`}
                      </>
                    ) : (
                      user.age ? `${user.age}세` : '-'
                    )}
                  </TableCell>
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
                    {getSignupRouteLabel(user.signupRoute)}
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
                      {getRejectionReasonLabel(user.rejectionReason)}
                    </TableCell>
                  )}
                  <TableCell>
                    {(user as any).lastPushNotificationAt ?
                      new Date((user as any).lastPushNotificationAt).toLocaleDateString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '-'
                    }
                  </TableCell>
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
      )}

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
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (e.target.value !== 'OTHER') {
                  setCustomRejectionReason('');
                }
              }}
              label="거부 사유"
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
                label="기타 거부 사유"
                multiline
                rows={3}
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                placeholder="거부 사유를 직접 입력해주세요"
                required
              />
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectionModalOpen(false)}>취소</Button>
          <Button
            onClick={handleRejection}
            variant="contained"
            color="error"
            disabled={processing || !rejectionReason.trim() || (rejectionReason === 'OTHER' && !customRejectionReason.trim())}
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

