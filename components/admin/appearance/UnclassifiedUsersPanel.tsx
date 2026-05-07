'use client';

import { useState, useEffect, useMemo } from 'react';
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
  MenuItem,
  Pagination,
  Menu,
  Link,
  Tabs,
  Tab,
  Stack,
  ToggleButtonGroup,
  ToggleButton,
  alpha,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  isBlindApprovedUser,
  isGradeRequiredUser,
} from '@/app/admin/users/appearance/types';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import UnclassifiedUsersTable from './UnclassifiedUsersTable';
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
    'GHE': '김해',
    'ICN': '인천',
    'SEL': '서울',
    'KYG': '경기',
    'CAN': '천안',
    'GWJ': '광주',
    'GNG': '강원',
    'JJA': '제주'
  };
  return region ? regionMap[region] || region : '-';
};

const hasApprovalContractFields = (user: UserProfileWithAppearance) =>
  user.approvalMode !== undefined ||
  user.blindMatchingApprovedAt !== undefined ||
  user.hasApprovedPhoto !== undefined ||
  user.approvedPhotoCount !== undefined;

const isGradeRequiredCohortUser = (user: UserProfileWithAppearance) =>
  isGradeRequiredUser(user) ||
  (user.appearanceGrade === 'UNKNOWN' && !isBlindApprovedUser(user) && !hasApprovalContractFields(user));

export default function UnclassifiedUsersPanel() {
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [activeCohort, setActiveCohort] = useState<'GRADE_REQUIRED' | 'BLIND_APPROVED'>('GRADE_REQUIRED');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

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

  const gradeRequiredUsers = useMemo(() => users.filter(isGradeRequiredCohortUser), [users]);

  const blindApprovedUsers = useMemo(() => users.filter(isBlindApprovedUser), [users]);

  const cohortUsers = activeCohort === 'BLIND_APPROVED' ? blindApprovedUsers : gradeRequiredUsers;
  const totalPages = Math.max(1, Math.ceil(cohortUsers.length / pageSize));
  const visibleUsers = cohortUsers.slice((page - 1) * pageSize, page * pageSize);

  const gradeRequiredCount = gradeRequiredUsers.length;
  const blindApprovedCount = blindApprovedUsers.length;

  // 미분류 사용자 목록 조회
  const fetchUnclassifiedUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const firstPage = await AdminService.userAppearance.getUnclassifiedUsers(1, pageSize, getRegionParam());
      const meta = firstPage.meta ?? {};
      const totalPagesFromMeta = Number(meta.totalPages ?? 1);
      const itemsPerPageFromMeta = Number(meta.itemsPerPage ?? pageSize);
      const totalItems = Number(
        meta.totalItems ??
        meta.total ??
        (totalPagesFromMeta > 1 ? totalPagesFromMeta * itemsPerPageFromMeta : undefined) ??
        firstPage.data.length,
      );

      if (totalItems > firstPage.data.length) {
        const fullResponse = await AdminService.userAppearance.getUnclassifiedUsers(
          1,
          Math.max(totalItems, pageSize),
          getRegionParam(),
        );
        setUsers(fullResponse.data);
      } else {
        setUsers(firstPage.data);
      }
    } catch (err: any) {
      console.error('미분류 사용자 목록 조회 중 오류:', err);
      setError(err.message ?? '미분류 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    fetchUnclassifiedUsers();
  }, [region]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleUsersRemove = (userIds: string[]) => {
    setUsers((prev) => prev.filter((u) => !userIds.includes(u.userId ?? u.id)));
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
        <Box>
          <Typography variant="h6">미분류 사용자</Typography>
          <Typography variant="body2" color="text.secondary">
            UNKNOWN 사용자를 등급 정리 대상과 블라인드 승인 대상으로 분리합니다.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, v) => v && setViewMode(v)}
            size="small"
          >
            <ToggleButton value="card" aria-label="카드 뷰">
              <ViewModuleIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="table" aria-label="테이블 뷰">
              <ViewListIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
          <Button
            variant="outlined"
            color="primary"
            onClick={fetchUnclassifiedUsers}
            disabled={loading}
          >
            새로고침
          </Button>
        </Box>
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

      <Tabs
        value={activeCohort}
        onChange={(_, value) => {
          setActiveCohort(value);
          setPage(1);
        }}
        aria-label="미분류 사용자 승인 유형"
        sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab value="GRADE_REQUIRED" label={`등급 정리 필요 (${gradeRequiredCount})`} />
        <Tab value="BLIND_APPROVED" label={`블라인드 승인 (${blindApprovedCount})`} />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : visibleUsers.length === 0 ? (
        <Alert severity="info">
          {activeCohort === 'GRADE_REQUIRED'
            ? '등급 정리 필요 사용자가 없습니다.'
            : '블라인드 승인 사용자가 없습니다.'}
        </Alert>
      ) : viewMode === 'table' ? (
        <UnclassifiedUsersTable
          users={visibleUsers}
          loading={loading}
          error={error}
          cohort={activeCohort}
          totalCount={cohortUsers.length}
          page={page}
          pageSize={pageSize}
          onPageChange={setPage}
          onRefresh={fetchUnclassifiedUsers}
          onUsersRemove={handleUsersRemove}
        />
      ) : (
        <>
          <Grid container spacing={2}>
            {visibleUsers.map((user) => {
              const approvedPhotoCount = Number(user.approvedPhotoCount ?? 0);
              const isBlindApproved = isBlindApprovedUser(user);

              return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={user.userId}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Avatar
                        src={user.profileImageUrl ?? user.profileImages?.[0]?.url ?? ''}
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

                      <Stack direction="row" spacing={0.75} justifyContent="center" flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                        <Chip
                          label={isBlindApproved ? '블라인드 승인' : '등급 필요'}
                          size="small"
                          sx={{
                            bgcolor: isBlindApproved ? alpha('#2563EB', 0.1) : alpha('#D97706', 0.12),
                            color: isBlindApproved ? '#2563EB' : '#D97706',
                            fontWeight: 700,
                          }}
                        />
                        <Chip
                          label={`승인 사진 ${approvedPhotoCount}장`}
                          size="small"
                          sx={{
                            bgcolor: alpha('#059669', 0.1),
                            color: '#059669',
                            fontWeight: 700,
                          }}
                        />
                      </Stack>

                      {/* 프로필 정보 입력 여부 */}
                      <Chip
                        label={user.hasPreferences ? "프로필 입력 완료" : "프로필 미입력"}
                        size="small"
                        sx={{
                          bgcolor: user.hasPreferences ? '#e8f5e8' : '#ffebee',
                          color: user.hasPreferences ? '#2e7d32' : '#c62828',
                          fontWeight: 'medium',
                          mb: 1
                        }}
                      />

                      {/* 장기 미접속자 표시 */}
                      {user.isLongTermInactive && (
                        <Chip
                          label="장기 미접속"
                          size="small"
                          sx={{
                            bgcolor: '#fff3cd',
                            color: '#856404',
                            fontWeight: 'medium',
                            mb: 1
                          }}
                        />
                      )}

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
              );
            })}
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
