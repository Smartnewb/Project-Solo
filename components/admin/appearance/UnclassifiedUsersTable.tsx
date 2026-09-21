import { useState } from 'react';
import {
  Box,
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
  Menu,
  Link,
  Stack,
  LinearProgress,
  alpha,
} from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  isBlindApprovedUser,
} from '@/app/admin/users/appearance/types';
import { appearanceGradeEventBus } from '@/app/admin/users/appearance/event-bus';
import UserDetailModal, { UserDetail } from './UserDetailModal';

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
    DJN: '대전', SJG: '세종', CJU: '청주', BSN: '부산', DGU: '대구',
    GJJ: '공주', GHE: '김해', ICN: '인천', SEL: '서울', KYG: '경기',
    CAN: '천안', GWJ: '광주', GNG: '강원', JJA: '제주',
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

interface UnclassifiedUsersTableProps {
  users: UserProfileWithAppearance[];
  loading: boolean;
  error: string | null;
  cohort: 'GRADE_REQUIRED' | 'BLIND_APPROVED';
  totalCount: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onUsersRemove: (userIds: string[]) => void;
}

interface ApproveResult {
  userId: string;
  success: boolean;
  error?: string;
}

export default function UnclassifiedUsersTable({
  users,
  loading,
  error,
  cohort,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onRefresh,
  onUsersRemove,
}: UnclassifiedUsersTableProps) {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfileWithAppearance | null>(null);
  const [savingGrade, setSavingGrade] = useState(false);

  const [bulkGradeModalOpen, setBulkGradeModalOpen] = useState(false);
  const [bulkSelectedGrade, setBulkSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [savingBulkGrade, setSavingBulkGrade] = useState(false);

  const [bulkApproveModalOpen, setBulkApproveModalOpen] = useState(false);
  const [approving, setApproving] = useState(false);
  const [approveProgress, setApproveProgress] = useState(0);
  const [approveCurrent, setApproveCurrent] = useState(0);
  const [approveTotal, setApproveTotal] = useState(0);
  const [approveResults, setApproveResults] = useState<ApproveResult[]>([]);
  const [approveCompleted, setApproveCompleted] = useState(false);

  const [combinedWorkflowModalOpen, setCombinedWorkflowModalOpen] = useState(false);
  const [combinedGrade, setCombinedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [combinedPhase, setCombinedPhase] = useState<'select' | 'grading' | 'approving' | 'done'>('select');
  const [combinedPhaseError, setCombinedPhaseError] = useState<string | null>(null);
  const [combinedApproveProgress, setCombinedApproveProgress] = useState(0);
  const [combinedApproveCurrent, setCombinedApproveCurrent] = useState(0);
  const [combinedApproveTotal, setCombinedApproveTotal] = useState(0);
  const [combinedApproveResults, setCombinedApproveResults] = useState<ApproveResult[]>([]);

  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const [localError, setLocalError] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const isGradeRequiredCohort = cohort === 'GRADE_REQUIRED';

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

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error ? error.message : fallback;

  const handleSelectUser = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => getUserId(u)).filter(Boolean));
    }
  };

  const handleOpenGradeMenu = (event: React.MouseEvent<HTMLElement>, user: UserProfileWithAppearance) => {
    setGradeMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
  };

  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    if (!selectedUser) return;
    const userId = getUserId(selectedUser);
    if (!userId) return;

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);
      appearanceGradeEventBus.publish();

      if (newGrade !== 'UNKNOWN') {
        onUsersRemove([userId]);
      } else {
        onRefresh();
      }
      handleCloseGradeMenu();
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, '등급 설정 중 오류가 발생했습니다.'));
    } finally {
      setSavingGrade(false);
    }
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
    } catch (err: unknown) {
      setUserDetailError(getErrorMessage(err, '유저 상세 정보를 불러오는 중 오류가 발생했습니다.'));
    } finally {
      setLoadingUserDetail(false);
    }
  };

  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  const handleSaveBulkGrade = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setSavingBulkGrade(true);
      await AdminService.userAppearance.bulkSetUserAppearanceGrade(selectedUsers, bulkSelectedGrade);
      appearanceGradeEventBus.publish();

      if (bulkSelectedGrade !== 'UNKNOWN') {
        onUsersRemove(selectedUsers);
      } else {
        onRefresh();
      }
      setSelectedUsers([]);
      setBulkGradeModalOpen(false);
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, '일괄 등급 설정 중 오류가 발생했습니다.'));
    } finally {
      setSavingBulkGrade(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) return;
    try {
      setApproving(true);
      setApproveProgress(0);
      setApproveCurrent(0);
      setApproveTotal(selectedUsers.length);
      setApproveResults([]);
      setApproveCompleted(false);

      const results = await AdminService.userReview.bulkApproveUsers(
        selectedUsers,
        (current, total) => {
          setApproveCurrent(current);
          setApproveProgress(Math.round((current / total) * 100));
        },
      );

      setApproveResults(results);
      setApproveCompleted(true);

      const succeededIds = results.filter((r) => r.success).map((r) => r.userId);
      if (succeededIds.length > 0) {
        onUsersRemove(succeededIds);
      }
      onRefresh();
    } catch (err: unknown) {
      setLocalError(getErrorMessage(err, '일괄 승인 중 오류가 발생했습니다.'));
    } finally {
      setApproving(false);
    }
  };

  const handleCombinedWorkflow = async () => {
    if (selectedUsers.length === 0 || combinedGrade === 'UNKNOWN') return;

    try {
      setCombinedPhase('grading');
      setCombinedPhaseError(null);

      await AdminService.userAppearance.bulkSetUserAppearanceGrade(selectedUsers, combinedGrade);
      appearanceGradeEventBus.publish();

      setCombinedPhase('approving');
      setCombinedApproveProgress(0);
      setCombinedApproveCurrent(0);
      setCombinedApproveTotal(selectedUsers.length);
      setCombinedApproveResults([]);

      const results = await AdminService.userReview.bulkApproveUsers(
        selectedUsers,
        (current, total) => {
          setCombinedApproveCurrent(current);
          setCombinedApproveProgress(Math.round((current / total) * 100));
        },
      );

      setCombinedApproveResults(results);
      setCombinedPhase('done');

      const succeededIds = results.filter((r) => r.success).map((r) => r.userId);
      if (succeededIds.length > 0) {
        onUsersRemove(succeededIds);
      }
      onRefresh();
    } catch (err: unknown) {
      setCombinedPhaseError(getErrorMessage(err, '처리 중 오류가 발생했습니다.'));
      setCombinedPhase('done');
      onRefresh();
    }
  };

  const displayError = localError || error;

  return (
    <Box>
      {displayError && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setLocalError(null)}>
          {displayError}
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
        <Typography variant="body2" sx={{ color: selectedUsers.length > 0 ? '#1E293B' : '#64748B' }}>
          {selectedUsers.length > 0 ? (
            <span>
              <strong style={{ color: '#1E293B' }}>{selectedUsers.length}명</strong> 선택됨
            </span>
          ) : (
            '왼쪽 체크박스를 선택하면 일괄 작업 버튼이 활성화됩니다.'
          )}
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            size="small"
            disabled={selectedUsers.length === 0}
            onClick={() => setBulkGradeModalOpen(true)}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
          >
            일괄 등급 설정
          </Button>
          {isGradeRequiredCohort && (
            <>
              <Button
                variant="outlined"
                size="small"
                color="success"
                disabled={selectedUsers.length === 0}
                onClick={() => setBulkApproveModalOpen(true)}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
              >
                일괄 승인
              </Button>
              <Button
                variant="contained"
                size="small"
                color="primary"
                disabled={selectedUsers.length === 0}
                onClick={() => {
                  setCombinedGrade('UNKNOWN');
                  setCombinedPhase('select');
                  setCombinedPhaseError(null);
                  setCombinedWorkflowModalOpen(true);
                }}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
              >
                등급 설정 + 승인
              </Button>
            </>
          )}
        </Stack>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          borderRadius: 2,
          boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          border: '1px solid #E2E8F0',
          overflowX: 'auto',
        }}
      >
        <Table size="small" sx={{ minWidth: 1100 }}>
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
              <TableCell sx={{ ...headerCellSx, minWidth: 80 }}>지역</TableCell>
              <TableCell sx={headerCellSx}>대학교</TableCell>
              <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>구분</TableCell>
              <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>승인사진</TableCell>
              <TableCell sx={{ ...headerCellSx, textAlign: 'center' }}>등급</TableCell>
              <TableCell sx={headerCellSx}>인스타그램</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    조회된 사용자가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const userId = getUserId(user);
                const instagramId = getInstagramId(user);
                const approvedPhotoCount = Number(user.approvedPhotoCount ?? 0);
                const isBlindApproved = isBlindApprovedUser(user);

                return (
                  <TableRow
                    key={userId}
                    hover
                    sx={{
                      bgcolor: isBlindApproved
                        ? alpha('#2563EB', 0.03)
                        : 'inherit',
                      '&:hover': { bgcolor: '#F8FAFC' },
                      transition: 'background-color 0.15s',
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ ...bodyCellSx, pl: 2 }}>
                      <Checkbox
                        size="small"
                        checked={selectedUsers.includes(userId)}
                        onChange={() => handleSelectUser(userId)}
                      />
                    </TableCell>

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

                    <TableCell sx={bodyCellSx}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {user.age}
                        <Typography component="span" variant="caption" sx={{ color: '#94A3B8', ml: 0.5 }}>
                          {GENDER_LABELS[user.gender]}
                        </Typography>
                      </Typography>
                    </TableCell>

                    <TableCell sx={bodyCellSx}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {getRegionLabel(user.region)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={bodyCellSx}>
                      <Typography variant="body2" sx={{ color: '#334155' }}>
                        {getUniversityName(user)}
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      <Chip
                        label={isBlindApproved ? '블라인드 승인' : '등급 필요'}
                        size="small"
                        sx={{
                          bgcolor: isBlindApproved ? alpha('#2563EB', 0.1) : alpha('#D97706', 0.12),
                          color: isBlindApproved ? '#2563EB' : '#D97706',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      <Chip
                        label={`${approvedPhotoCount}장`}
                        size="small"
                        variant={approvedPhotoCount > 0 ? 'filled' : 'outlined'}
                        sx={{
                          bgcolor: approvedPhotoCount > 0 ? alpha('#059669', 0.1) : '#fff',
                          borderColor: approvedPhotoCount > 0 ? alpha('#059669', 0.2) : alpha('#D97706', 0.35),
                          color: approvedPhotoCount > 0 ? '#047857' : '#D97706',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </TableCell>

                    <TableCell sx={{ ...bodyCellSx, textAlign: 'center' }}>
                      <Chip
                        label={GRADE_LABELS[user.appearanceGrade]}
                        size="small"
                        sx={{
                          bgcolor: GRADE_COLORS[user.appearanceGrade],
                          color: 'white',
                          fontWeight: 700,
                          cursor: 'pointer',
                          fontSize: '0.75rem',
                          minWidth: 48,
                        }}
                        onClick={(e) => handleOpenGradeMenu(e, user)}
                      />
                    </TableCell>

                    <TableCell sx={bodyCellSx}>
                      {instagramId ? (
                        <Link
                          href={`https://instagram.com/${instagramId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontSize: '0.8125rem',
                            '&:hover': { textDecoration: 'underline' },
                          }}
                        >
                          <InstagramIcon sx={{ mr: 0.5, color: '#E1306C' }} fontSize="small" />
                          {instagramId}
                          <OpenInNewIcon sx={{ ml: 0.5 }} fontSize="small" />
                        </Link>
                      ) : (
                        <Typography variant="body2" sx={{ color: '#94A3B8' }}>-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <Button
            size="small"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            sx={{ minWidth: 32, borderRadius: 1 }}
          >
            ◀
          </Button>
          <Typography variant="body2" sx={{ px: 1.5, color: '#475569' }}>
            {page} / {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            sx={{ minWidth: 32, borderRadius: 1 }}
          >
            ▶
          </Button>
        </Stack>
      </Box>

      {/* 개별 등급 변경 메뉴 */}
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
            disabled={savingGrade}
            sx={{
              py: 1,
              fontSize: '0.875rem',
              fontWeight: selectedUser?.appearanceGrade === grade ? 700 : 400,
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
            {selectedUser?.appearanceGrade === grade && ' ✓'}
          </MenuItem>
        ))}
      </Menu>

      {/* 일괄 등급 설정 다이얼로그 */}
      <Dialog open={bulkGradeModalOpen} onClose={() => !savingBulkGrade && setBulkGradeModalOpen(false)}>
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
          <Button onClick={() => setBulkGradeModalOpen(false)} disabled={savingBulkGrade}>
            취소
          </Button>
          <Button onClick={handleSaveBulkGrade} variant="contained" disabled={savingBulkGrade}>
            {savingBulkGrade ? <CircularProgress size={20} /> : '일괄 적용'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 일괄 승인 다이얼로그 */}
      <Dialog
        open={bulkApproveModalOpen}
        onClose={() => !approving && setBulkApproveModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>일괄 프로필 승인</DialogTitle>
        <DialogContent>
          {!approving && !approveCompleted ? (
            <Typography variant="body1" sx={{ py: 2 }}>
              선택한 <strong>{selectedUsers.length}명</strong>의 프로필을 승인하시겠습니까?
            </Typography>
          ) : (
            <Box sx={{ py: 2 }}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    {approveCompleted ? '처리 완료' : '처리 중...'}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {approveCurrent} / {approveTotal}
                  </Typography>
                </Box>
                <LinearProgress
                  variant={approveCompleted ? 'determinate' : 'determinate'}
                  value={approveProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ maxHeight: 240, overflowY: 'auto' }}>
                {approveResults.map((result) => (
                  <Box
                    key={result.userId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.825rem' }}>
                      {result.success ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                      {result.userId}
                    </Typography>
                    {!result.success && result.error && (
                      <Typography variant="caption" sx={{ color: '#EF4444' }}>
                        - {result.error}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {!approving && !approveCompleted ? (
            <>
              <Button onClick={() => setBulkApproveModalOpen(false)}>취소</Button>
              <Button onClick={handleBulkApprove} variant="contained" color="success">
                승인
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setBulkApproveModalOpen(false);
                setApproveResults([]);
                setApproveCompleted(false);
              }}
              disabled={!approveCompleted}
              variant="contained"
            >
              닫기
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* 등급 설정 + 승인 연계 다이얼로그 */}
      <Dialog
        open={combinedWorkflowModalOpen}
        onClose={() => combinedPhase === 'select' && setCombinedWorkflowModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>등급 설정 + 프로필 승인</DialogTitle>
        <DialogContent>
          {combinedPhase === 'select' && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body2" sx={{ mb: 2, color: '#64748B' }}>
                선택한 <strong>{selectedUsers.length}명</strong>에게 등급을 설정한 후 프로필을 승인합니다.
              </Typography>
              <FormControl fullWidth sx={{ mt: 1 }}>
                <InputLabel>등급</InputLabel>
                <Select
                  value={combinedGrade}
                  label="등급"
                  onChange={(e) => setCombinedGrade(e.target.value as AppearanceGrade)}
                >
                  {(['S', 'A', 'B', 'C'] as AppearanceGrade[]).map((grade) => (
                    <MenuItem key={grade} value={grade}>
                      {GRADE_LABELS[grade]}등급
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {(combinedPhase === 'grading' || combinedPhase === 'approving' || combinedPhase === 'done') && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1E293B' }}>
                1단계: 등급 설정
              </Typography>
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: combinedPhaseError && combinedPhase !== 'approving'
                    ? alpha('#EF4444', 0.08)
                    : alpha('#059669', 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                {combinedPhaseError && combinedPhase !== 'approving' ? (
                  <>
                    <Typography>❌</Typography>
                    <Typography variant="body2" sx={{ color: '#EF4444' }}>
                      {combinedPhaseError}
                    </Typography>
                  </>
                ) : (
                  <>
                    <Typography>✅</Typography>
                    <Typography variant="body2" sx={{ color: '#059669' }}>
                      {combinedGrade}등급 일괄 설정 완료
                    </Typography>
                  </>
                )}
              </Box>

              <Typography variant="subtitle2" sx={{ mb: 1, color: '#1E293B' }}>
                2단계: 프로필 승인
              </Typography>
              <Box sx={{ mb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ color: '#475569' }}>
                    {combinedPhase === 'approving'
                      ? '처리 중...'
                      : combinedPhase === 'done'
                        ? '처리 완료'
                        : ''}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
                    {combinedApproveCurrent} / {combinedApproveTotal}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={combinedApproveProgress}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>

              <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {combinedApproveResults.map((result) => (
                  <Box
                    key={result.userId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      py: 0.5,
                    }}
                  >
                    <Typography sx={{ fontSize: '0.825rem' }}>
                      {result.success ? '✅' : '❌'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#334155' }}>
                      {result.userId}
                    </Typography>
                    {!result.success && result.error && (
                      <Typography variant="caption" sx={{ color: '#EF4444' }}>
                        - {result.error}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {combinedPhase === 'select' ? (
            <>
              <Button onClick={() => setCombinedWorkflowModalOpen(false)}>취소</Button>
              <Button
                onClick={handleCombinedWorkflow}
                variant="contained"
                disabled={combinedGrade === 'UNKNOWN'}
              >
                실행
              </Button>
            </>
          ) : (
            <Button
              onClick={() => {
                setCombinedWorkflowModalOpen(false);
                setCombinedApproveResults([]);
              }}
              disabled={combinedPhase !== 'done'}
              variant="contained"
            >
              닫기
            </Button>
          )}
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
          onRefresh={onRefresh}
        />
      )}
    </Box>
  );
}
