'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Button,
  Chip,
  Avatar,
  Typography,
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
  Checkbox,
  Tooltip,
  Menu,
  Link,
  Stack,
  alpha,
} from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  UserStatus,
} from '@/app/admin/users/appearance/types';
import {
  formatDateWithoutTimezoneConversion,
  formatDateTimeWithoutTimezoneConversion,
} from '@/app/utils/formatters';
import { appearanceGradeEventBus } from '@/app/admin/users/appearance/event-bus';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import BulkEmailNotificationModal from './modals/BulkEmailNotificationModal';

const GRADE_COLORS: Record<AppearanceGrade, string> = {
  S: '#7C3AED',
  A: '#2563EB',
  B: '#059669',
  C: '#D97706',
  UNKNOWN: '#94A3B8',
};

const GRADE_LABELS: Record<AppearanceGrade, string> = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  UNKNOWN: '미분류',
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: '남',
  FEMALE: '여',
};

const getRegionLabel = (region?: string) => {
  const regionMap: Record<string, string> = {
    DJN: '대전',
    SJG: '세종',
    CJU: '청주',
    BSN: '부산',
    DGU: '대구',
    GJJ: '공주',
    GHE: '김해',
    ICN: '인천',
    SEL: '서울',
    KYG: '경기',
    CAN: '천안',
    GWJ: '광주',
    GNG: '강원',
    JJA: '제주',
  };
  return region ? regionMap[region] || region : '-';
};

const headerCellSx = {
  whiteSpace: 'nowrap',
  fontWeight: 600,
  fontSize: '0.8125rem',
  color: '#475569',
  bgcolor: '#F8FAFC',
  borderBottom: '2px solid #E2E8F0',
  py: 1.5,
  px: 1.5,
} as const;

const bodyCellSx = {
  whiteSpace: 'nowrap',
  py: 1.25,
  px: 1.5,
  fontSize: '0.8125rem',
  borderBottom: '1px solid #F1F5F9',
} as const;

interface UserAppearanceTableProps {
  initialFilters?: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
    isLongTermInactive?: boolean;
    hasPreferences?: boolean;
    includeDeleted?: boolean;
  };
  userStatus?: UserStatus;
}

interface UserAppearanceTableRef {
  handleApplyFilter: (filters: any) => void;
}

const UserAppearanceTable = forwardRef<UserAppearanceTableRef, UserAppearanceTableProps>(
  ({ initialFilters, userStatus }, ref) => {
    const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState(initialFilters || {});

    const [selectedUser, setSelectedUser] = useState<UserProfileWithAppearance | null>(null);
    const [selectedGrade, setSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
    const [savingGrade, setSavingGrade] = useState(false);
    const [gradeMenuAnchorEl, setGradeMenuAnchorEl] = useState<null | HTMLElement>(null);

    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
    const [bulkSelectedGrade, setBulkSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
    const [savingBulkGrade, setSavingBulkGrade] = useState(false);

    const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

    const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [loadingUserDetail, setLoadingUserDetail] = useState(false);
    const [userDetailError, setUserDetailError] = useState<string | null>(null);

    const [universityApprovalDialogOpen, setUniversityApprovalDialogOpen] = useState(false);
    const [userToApprove, setUserToApprove] = useState<UserProfileWithAppearance | null>(null);
    const [approvingUniversity, setApprovingUniversity] = useState(false);

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await AdminService.userAppearance.getUsersWithAppearanceGrade({
          page: page + 1,
          limit: rowsPerPage,
          ...filters,
          ...(userStatus && { userStatus }),
        });
        setUsers(response.data);
        setTotalItems(response.meta?.total ?? 0);
      } catch (err: any) {
        setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => {
      fetchUsers();
    }, [page, rowsPerPage, filters, userStatus]);

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
      setRowsPerPage(parseInt(event.target.value, 10));
      setPage(0);
    };

    const handleApplyFilter = (newFilters: any) => {
      setFilters(newFilters);
      setPage(0);
    };

    useImperativeHandle(ref, () => ({
      handleApplyFilter: (newFilters: any) => handleApplyFilter(newFilters),
    }));

    const handleOpenGradeMenu = (event: React.MouseEvent<HTMLElement>, user: UserProfileWithAppearance) => {
      setGradeMenuAnchorEl(event.currentTarget);
      setSelectedUser(user);
      setSelectedGrade(user.appearanceGrade);
    };

    const handleCloseGradeMenu = () => {
      setGradeMenuAnchorEl(null);
    };

    const handleUniversityVerificationApproval = (userId: string) => {
      const user = users.find((u) => (u.userId || u.id) === userId);
      if (user) {
        setUserToApprove(user);
        setUniversityApprovalDialogOpen(true);
      }
    };

    const handleConfirmUniversityApproval = async () => {
      if (!userToApprove) return;
      try {
        setApprovingUniversity(true);
        await AdminService.userAppearance.approveUniversityVerification(userToApprove.userId || userToApprove.id);
        setUsers((prev) =>
          prev.map((user) =>
            (user.userId || user.id) === (userToApprove.userId || userToApprove.id)
              ? { ...user, isUniversityVerified: true }
              : user,
          ),
        );
        setUniversityApprovalDialogOpen(false);
        setUserToApprove(null);
      } catch (error: any) {
        setError(error.message || '대학교 인증 승인 중 오류가 발생했습니다.');
      } finally {
        setApprovingUniversity(false);
      }
    };

    const handleSaveGrade = async (newGrade: AppearanceGrade) => {
      if (!selectedUser) return;
      const userId = selectedUser.userId || selectedUser.id;
      if (!userId) return;

      try {
        setSavingGrade(true);
        await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);
        setUsers((prev) =>
          prev.map((user) => ((user.userId || user.id) === userId ? { ...user, appearanceGrade: newGrade } : user)),
        );
        appearanceGradeEventBus.publish();
        handleCloseGradeMenu();
      } catch (err: any) {
        setError(err.message || '등급 설정 중 오류가 발생했습니다.');
      } finally {
        setSavingGrade(false);
      }
    };

    const handleSelectUser = (userId: string) => {
      setSelectedUsers((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
    };

    const handleSelectAllUsers = () => {
      if (selectedUsers.length === users.length) {
        setSelectedUsers([]);
      } else {
        setSelectedUsers(users.map((user) => user.userId || user.id).filter(Boolean) as string[]);
      }
    };

    const handleOpenBulkEditModal = () => {
      if (selectedUsers.length === 0) return;
      setBulkEditModalOpen(true);
    };

    const handleOpenBulkEmailModal = () => {
      if (selectedUsers.length === 0) return;
      setBulkEmailModalOpen(true);
    };

    const handleOpenUserDetailModal = async (userId: string) => {
      try {
        setSelectedUserId(userId);
        setUserDetailModalOpen(true);
        setLoadingUserDetail(true);
        setUserDetailError(null);
        setUserDetail(null);
        const data = await AdminService.userAppearance.getUserDetails(userId);
        setUserDetail(data);
      } catch (error: any) {
        setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoadingUserDetail(false);
      }
    };

    const handleSaveBulkGrade = async () => {
      if (selectedUsers.length === 0) return;
      try {
        setSavingBulkGrade(true);
        await AdminService.userAppearance.bulkSetUserAppearanceGrade(selectedUsers, bulkSelectedGrade);
        setUsers((prev) =>
          prev.map((user) =>
            selectedUsers.includes(user.userId || user.id)
              ? { ...user, appearanceGrade: bulkSelectedGrade }
              : user,
          ),
        );
        appearanceGradeEventBus.publish();
        setSelectedUsers([]);
        setBulkEditModalOpen(false);
      } catch (err: any) {
        setError(err.message || '일괄 등급 설정 중 오류가 발생했습니다.');
      } finally {
        setSavingBulkGrade(false);
      }
    };

    const getUserId = (user: UserProfileWithAppearance) => user.userId || user.id;

    const getUniversityName = (user: UserProfileWithAppearance): string => {
      if (user.university) {
        return typeof user.university === 'string' ? user.university : user.university.name;
      }
      if (user.universityDetails) return user.universityDetails.name;
      if (user.universityName) return user.universityName;
      return '-';
    };

    const getInstagramId = (user: UserProfileWithAppearance): string | null => {
      if (!user.instagramId || user.instagramId === 'undefined' || user.instagramId === 'null') {
        return null;
      }
      return user.instagramId;
    };

    return (
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* 일괄 작업 바 */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            px: 1,
          }}
        >
          <Typography variant="body2" sx={{ color: '#64748B' }}>
            {selectedUsers.length > 0 ? (
              <span>
                <strong style={{ color: '#1E293B' }}>{selectedUsers.length}명</strong> 선택됨
              </span>
            ) : (
              '사용자를 선택하여 일괄 작업 수행'
            )}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={selectedUsers.length === 0}
              onClick={handleOpenBulkEditModal}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              일괄 등급 설정
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="info"
              disabled={selectedUsers.length === 0}
              onClick={handleOpenBulkEmailModal}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
            >
              일괄 이메일 발송
            </Button>
          </Stack>
        </Box>

        <Typography variant="caption" sx={{ display: 'block', mb: 1.5, px: 1, color: '#64748B' }}>
          정렬 기준: 최근 접속 우선, 미접속 사용자는 가입일 최신순
        </Typography>

        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 2,
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            border: '1px solid #E2E8F0',
            overflowX: 'auto',
          }}
        >
          <Table size="small" sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ ...headerCellSx, pl: 2 }}>
                  <Checkbox
                    size="small"
                    indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                    checked={users.length > 0 && selectedUsers.length === users.length}
                    onChange={handleSelectAllUsers}
                  />
                </TableCell>
                <TableCell sx={{ ...headerCellSx, minWidth: 200 }}>사용자</TableCell>
                <TableCell sx={{ ...headerCellSx, minWidth: 80 }}>나이</TableCell>
                <TableCell sx={headerCellSx}>전화번호</TableCell>
                <TableCell sx={headerCellSx}>대학교</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>인증</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>등급</TableCell>
                <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>상태</TableCell>
                <TableCell sx={headerCellSx}>인스타그램</TableCell>
                <TableCell sx={headerCellSx}>가입일</TableCell>
                <TableCell sx={headerCellSx}>최근 접속</TableCell>
                <TableCell sx={headerCellSx}>최근 알림</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      조회된 사용자가 없습니다.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const userId = getUserId(user);
                  const instagramId = getInstagramId(user);

                  return (
                    <TableRow
                      key={userId}
                      hover
                      sx={{
                        bgcolor:
                          user.statusAt === 'instagramerror'
                            ? 'rgba(239, 68, 68, 0.04)'
                            : user.isLongTermInactive
                              ? 'rgba(245, 158, 11, 0.04)'
                              : 'inherit',
                        '&:hover': { bgcolor: '#F8FAFC' },
                        transition: 'background-color 0.15s',
                      }}
                    >
                      {/* 체크박스 */}
                      <TableCell padding="checkbox" sx={{ ...bodyCellSx, pl: 2 }}>
                        <Checkbox
                          size="small"
                          checked={selectedUsers.includes(userId)}
                          onChange={() => handleSelectUser(userId)}
                        />
                      </TableCell>

                      {/* 사용자 (프로필 + 이름 + 이메일 통합) */}
                      <TableCell sx={bodyCellSx}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            src={user.profileImageUrl || user.profileImages?.[0]?.url || ''}
                            alt={user.name}
                            sx={{
                              width: 36,
                              height: 36,
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              transition: 'box-shadow 0.15s',
                              '&:hover': { boxShadow: '0 0 0 2px #3b82f6' },
                            }}
                            onClick={() => handleOpenUserDetailModal(userId)}
                          >
                            {user.name?.charAt(0) || '?'}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: '#1E293B',
                                cursor: 'pointer',
                                '&:hover': { color: '#2563EB' },
                              }}
                              onClick={() => handleOpenUserDetailModal(userId)}
                            >
                              {user.name}
                            </Typography>
                            {user.email && (
                              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block' }}>
                                {user.email}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 나이/성별 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {user.age}
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{ color: '#94A3B8', ml: 0.5 }}
                          >
                            {GENDER_LABELS[user.gender]}
                          </Typography>
                        </Typography>
                      </TableCell>

                      {/* 전화번호 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {user.phoneNumber || '-'}
                        </Typography>
                      </TableCell>

                      {/* 대학교 + 지역 통합 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#334155' }}>
                          {getUniversityName(user)}
                        </Typography>
                        {user.region && (
                          <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                            {getRegionLabel(user.region)}
                          </Typography>
                        )}
                      </TableCell>

                      {/* 대학교 인증 */}
                      <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                        {user.isUniversityVerified ? (
                          <Chip
                            label="인증"
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              bgcolor: alpha('#059669', 0.1),
                              color: '#059669',
                            }}
                          />
                        ) : (
                          <Tooltip title="클릭하여 인증 처리">
                            <Chip
                              label="미인증"
                              size="small"
                              onClick={() => handleUniversityVerificationApproval(userId)}
                              sx={{
                                height: 24,
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                bgcolor: alpha('#D97706', 0.1),
                                color: '#D97706',
                                cursor: 'pointer',
                                '&:hover': { bgcolor: alpha('#D97706', 0.2) },
                              }}
                            />
                          </Tooltip>
                        )}
                      </TableCell>

                      {/* 외모 등급 */}
                      <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                        <Chip
                          label={GRADE_LABELS[user.appearanceGrade]}
                          size="small"
                          onClick={(e) => handleOpenGradeMenu(e, user)}
                          sx={{
                            height: 24,
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            bgcolor: alpha(GRADE_COLORS[user.appearanceGrade], 0.12),
                            color: GRADE_COLORS[user.appearanceGrade],
                            cursor: 'pointer',
                            border: `1px solid ${alpha(GRADE_COLORS[user.appearanceGrade], 0.3)}`,
                            '&:hover': {
                              bgcolor: alpha(GRADE_COLORS[user.appearanceGrade], 0.2),
                            },
                          }}
                        />
                      </TableCell>

                      {/* 상태 (휴먼 + 프로필정보 통합) */}
                      <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {user.isLongTermInactive && (
                            <Chip
                              label="휴먼"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.6875rem',
                                bgcolor: alpha('#EF4444', 0.1),
                                color: '#EF4444',
                              }}
                            />
                          )}
                          {!user.hasPreferences && (
                            <Chip
                              label="미입력"
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '0.6875rem',
                                bgcolor: alpha('#94A3B8', 0.1),
                                color: '#64748B',
                              }}
                            />
                          )}
                          {!user.isLongTermInactive && user.hasPreferences && (
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                              정상
                            </Typography>
                          )}
                        </Stack>
                      </TableCell>

                      {/* 인스타그램 */}
                      <TableCell sx={bodyCellSx}>
                        {instagramId ? (
                          <Link
                            href={user.instagramUrl || `https://instagram.com/${instagramId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              textDecoration: 'none',
                              color: '#334155',
                              fontSize: '0.8125rem',
                              '&:hover': { color: '#E1306C' },
                            }}
                          >
                            <InstagramIcon sx={{ fontSize: 16, color: '#E1306C' }} />
                            {instagramId}
                            {user.statusAt === 'instagramerror' && (
                              <Chip
                                label="오류"
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: '0.625rem',
                                  ml: 0.5,
                                  bgcolor: alpha('#EF4444', 0.1),
                                  color: '#EF4444',
                                }}
                              />
                            )}
                          </Link>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#CBD5E1' }}>
                            -
                          </Typography>
                        )}
                      </TableCell>

                      {/* 가입일 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          {formatDateWithoutTimezoneConversion(user.createdAt)}
                        </Typography>
                      </TableCell>

                      {/* 최근 접속 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          {user.lastActiveAt
                            ? formatDateTimeWithoutTimezoneConversion(user.lastActiveAt)
                            : '-'}
                        </Typography>
                      </TableCell>

                      {/* 최근 알림 */}
                      <TableCell sx={bodyCellSx}>
                        <Typography variant="body2" sx={{ color: '#64748B' }}>
                          {(user as any).lastPushNotificationAt
                            ? formatDateTimeWithoutTimezoneConversion((user as any).lastPushNotificationAt)
                            : '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalItems}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[10, 25, 50]}
          labelRowsPerPage="행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          sx={{ borderTop: '1px solid #E2E8F0' }}
        />

        {/* 등급 설정 메뉴 */}
        <Menu
          anchorEl={gradeMenuAnchorEl}
          open={Boolean(gradeMenuAnchorEl)}
          onClose={handleCloseGradeMenu}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          slotProps={{
            paper: {
              sx: { borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', minWidth: 120 },
            },
          }}
        >
          {(['S', 'A', 'B', 'C', 'UNKNOWN'] as AppearanceGrade[]).map((grade) => (
            <MenuItem
              key={grade}
              onClick={() => handleSaveGrade(grade)}
              selected={selectedGrade === grade}
              sx={{
                py: 1,
                fontSize: '0.875rem',
                fontWeight: selectedGrade === grade ? 700 : 400,
                color: GRADE_COLORS[grade],
              }}
            >
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: GRADE_COLORS[grade],
                  mr: 1.5,
                }}
              />
              {GRADE_LABELS[grade]}등급
            </MenuItem>
          ))}
        </Menu>

        {/* 일괄 등급 설정 모달 */}
        <Dialog open={bulkEditModalOpen} onClose={() => setBulkEditModalOpen(false)}>
          <DialogTitle>일괄 외모 등급 설정</DialogTitle>
          <DialogContent>
            <Box sx={{ minWidth: 300, pt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#64748B' }}>
                선택한 <strong>{selectedUsers.length}명</strong>에게 적용할 등급을 선택하세요.
              </Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>외모 등급</InputLabel>
                <Select
                  value={bulkSelectedGrade}
                  label="외모 등급"
                  onChange={(e) => setBulkSelectedGrade(e.target.value as AppearanceGrade)}
                >
                  {(['S', 'A', 'B', 'C', 'UNKNOWN'] as AppearanceGrade[]).map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {GRADE_LABELS[grade]}등급
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkEditModalOpen(false)} disabled={savingBulkGrade}>
              취소
            </Button>
            <Button onClick={handleSaveBulkGrade} variant="contained" disabled={savingBulkGrade}>
              {savingBulkGrade ? <CircularProgress size={20} /> : '일괄 적용'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 일괄 이메일 발송 모달 */}
        <BulkEmailNotificationModal
          open={bulkEmailModalOpen}
          onClose={() => setBulkEmailModalOpen(false)}
          userIds={selectedUsers}
          onSuccess={() => {
            fetchUsers();
            setSelectedUsers([]);
          }}
        />

        {/* 유저 상세 정보 모달 */}
        {!!userDetail && (
          <UserDetailModal
            open={userDetailModalOpen}
            onClose={() => setUserDetailModalOpen(false)}
            userId={selectedUserId}
            userDetail={userDetail}
            loading={loadingUserDetail}
            error={userDetailError}
            onRefresh={fetchUsers}
          />
        )}

        {/* 대학교 인증 승인 다이얼로그 */}
        <Dialog
          open={universityApprovalDialogOpen}
          onClose={() => {
            setUniversityApprovalDialogOpen(false);
            setUserToApprove(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>대학교 인증 승인</DialogTitle>
          <DialogContent>
            <Typography variant="body1" sx={{ mb: 2 }}>
              <strong>{userToApprove?.name}</strong>님의 대학교 인증을 승인하시겠습니까?
            </Typography>
            {userToApprove && (
              <Box sx={{ bgcolor: '#F8FAFC', p: 2, borderRadius: 2 }}>
                <Typography variant="body2">이름: {userToApprove.name}</Typography>
                <Typography variant="body2">
                  대학교: {getUniversityName(userToApprove)}
                </Typography>
                <Typography variant="body2">전화번호: {userToApprove.phoneNumber || '-'}</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setUniversityApprovalDialogOpen(false);
                setUserToApprove(null);
              }}
              disabled={approvingUniversity}
            >
              취소
            </Button>
            <Button
              onClick={handleConfirmUniversityApproval}
              variant="contained"
              disabled={approvingUniversity}
              startIcon={approvingUniversity ? <CircularProgress size={16} /> : null}
            >
              {approvingUniversity ? '승인 중...' : '승인'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
  },
);

export default UserAppearanceTable;
