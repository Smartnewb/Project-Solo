'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Avatar,
  Chip,
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
  IconButton,
  Menu,
  Link
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender
} from '@/app/admin/users/appearance/types';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import RegionFilter, { useRegionFilter } from '@/components/admin/common/RegionFilter';

// 등급 색상 정의
const GRADE_COLORS: Record<AppearanceGrade, string> = {
  'S': '#8E44AD', // 보라색
  'A': '#3498DB', // 파란색
  'B': '#2ECC71', // 초록색
  'C': '#F39C12', // 주황색
  'UNKNOWN': '#95A5A6' // 회색
};

// 등급 한글 표시
const GRADE_LABELS: Record<AppearanceGrade, string> = {
  'S': 'S등급',
  'A': 'A등급',
  'B': 'B등급',
  'C': 'C등급',
  'UNKNOWN': '미분류'
};

// 성별 한글 표시
const GENDER_LABELS: Record<Gender, string> = {
  'MALE': '남성',
  'FEMALE': '여성'
};

// 지역 한글 표시
const getRegionLabel = (region?: string) => {
  const regionMap: Record<string, string> = {
    'DJN': '대전',
    'SJG': '세종',
    'CJU': '청주',
    'BSN': '부산',
    'DGU': '대구',
    'GJJ': '공주',
    'ICN': '인천',
    'CAN': '천안'
  };
  return region ? regionMap[region] || region : '-';
};

export default function UnclassifiedUsersPanel() {
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(12);

  // 지역 필터 훅 사용
  const { region, setRegion: setRegionFilter, getRegionParam } = useRegionFilter();

  // 등급 설정 상태
  const [selectedUser, setSelectedUser] = useState<UserProfileWithAppearance | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // 유저 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 미분류 사용자 목록 조회
  const fetchUnclassifiedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AdminService.userAppearance.getUnclassifiedUsers(page, pageSize, getRegionParam());

      setUsers(response.items);
      setTotalPages(response.meta.totalPages);
    } catch (err: any) {
      console.error('미분류 사용자 목록 조회 중 오류:', err);
      setError(err.message ?? '미분류 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 및 지역 변경 시 데이터 조회
  useEffect(() => {
    fetchUnclassifiedUsers();
  }, [page, region]);

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 등급 토글 메뉴 열기
  const handleOpenGradeMenu = (event: React.MouseEvent<HTMLElement>, user: UserProfileWithAppearance) => {
    setGradeMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
    setSelectedGrade(user.appearanceGrade);
    setActiveUserId(user.userId ?? user.id);
  };

  // 등급 토글 메뉴 닫기
  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
    setActiveUserId(null);
  };

  // 유저 상세 정보 모달 열기
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

  // 유저 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 등급 설정 저장
  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    console.log('미분류 패널 - 등급 설정 시작:', { newGrade });
    console.log('미분류 패널 - 선택된 사용자:', selectedUser);

    if (!selectedUser) {
      console.error('미분류 패널 - 선택된 사용자가 없습니다.');
      setError('선택된 사용자가 없습니다.');
      return;
    }

    // userId가 없는 경우 id를 사용
    const userId = selectedUser.userId ?? selectedUser.id;

    if (!userId) {
      console.error('미분류 패널 - 선택된 사용자의 ID가 없습니다.');
      setError('선택된 사용자의 ID가 없습니다.');
      return;
    }

    console.log('미분류 패널 - 등급 설정 파라미터:', { userId, grade: newGrade });

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);
      console.log('미분류 패널 - 등급 설정 성공!');

      // 목록 업데이트 (미분류에서 제거)
      if (newGrade !== 'UNKNOWN') {
        setUsers(users.filter(user => {
          const userIdToCompare = user.userId ?? user.id;
          return userIdToCompare !== userId;
        }));
      } else {
        // 미분류로 다시 설정한 경우는 상태만 업데이트
        setUsers(users.map(user => {
          const userIdToCompare = user.userId ?? user.id;
          return userIdToCompare === userId
            ? { ...user, appearanceGrade: newGrade }
            : user;
        }));
      }

      handleCloseGradeMenu();
    } catch (err: any) {
      console.error('미분류 패널 - 등급 설정 중 오류:', err);
      setError(err.message ?? '등급 설정 중 오류가 발생했습니다.');
    } finally {
      setSavingGrade(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">미분류 사용자</Typography>
        <Button
          variant="outlined"
          color="primary"
          onClick={fetchUnclassifiedUsers}
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

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : users.length === 0 ? (
        <Alert severity="info">
          미분류 사용자가 없습니다.
        </Alert>
      ) : (
        <>
          <Grid container spacing={2}>
            {users.map((user) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={user.userId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar
                        src={user.profileImageUrl ?? user.profileImages?.[0]?.url ??
                             (user.gender === 'MALE'
                              ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
                              : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`)}
                        alt={user.name}
                        sx={{
                          width: 80,
                          height: 80,
                          mb: 2,
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
                        {user.age}세 / {GENDER_LABELS[user.gender]}
                      </Typography>

                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        지역: {getRegionLabel(user.region)}
                      </Typography>

                      {user.universityDetails?.name && (
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                          {user.universityDetails.name}
                        </Typography>
                      )}

                      {user.instagramId && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, mb: 1 }}>
                          <InstagramIcon sx={{ mr: 0.5, color: '#E1306C' }} fontSize="small" />
                          <Link
                            href={`https://instagram.com/${user.instagramId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              textDecoration: 'none',
                              color: 'primary.main',
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            {user.instagramId}
                            <OpenInNewIcon sx={{ ml: 0.5 }} fontSize="small" />
                          </Link>
                        </Box>
                      )}

                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                        <Chip
                          label={GRADE_LABELS[user.appearanceGrade]}
                          sx={{
                            bgcolor: GRADE_COLORS[user.appearanceGrade],
                            color: 'white',
                            cursor: 'pointer'
                          }}
                          onClick={(e) => handleOpenGradeMenu(e, user)}
                        />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
            />
          </Box>
        </>
      )}

      {/* 등급 설정 토글 메뉴 */}
      <Menu
        anchorEl={gradeMenuAnchorEl}
        open={Boolean(gradeMenuAnchorEl)}
        onClose={handleCloseGradeMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem
          onClick={() => handleSaveGrade('S')}
          sx={{
            color: GRADE_COLORS['S'],
            fontWeight: selectedGrade === 'S' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'S' ? 'rgba(142, 68, 173, 0.1)' : 'transparent'
          }}
        >
          S등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('A')}
          sx={{
            color: GRADE_COLORS['A'],
            fontWeight: selectedGrade === 'A' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'A' ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
          }}
        >
          A등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('B')}
          sx={{
            color: GRADE_COLORS['B'],
            fontWeight: selectedGrade === 'B' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'B' ? 'rgba(46, 204, 113, 0.1)' : 'transparent'
          }}
        >
          B등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('C')}
          sx={{
            color: GRADE_COLORS['C'],
            fontWeight: selectedGrade === 'C' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'C' ? 'rgba(243, 156, 18, 0.1)' : 'transparent'
          }}
        >
          C등급
        </MenuItem>
        <MenuItem
          onClick={() => handleSaveGrade('UNKNOWN')}
          sx={{
            color: GRADE_COLORS['UNKNOWN'],
            fontWeight: selectedGrade === 'UNKNOWN' ? 'bold' : 'normal',
            bgcolor: selectedGrade === 'UNKNOWN' ? 'rgba(149, 165, 166, 0.1)' : 'transparent'
          }}
        >
          미분류
        </MenuItem>
      </Menu>

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
            // 데이터 새로고침
            fetchUnclassifiedUsers();
          }}
        />
      )}
    </Box>
  );
}
