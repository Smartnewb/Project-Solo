'use client';

import { useState, useEffect } from 'react';
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
  IconButton,
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
  Link
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import InstagramIcon from '@mui/icons-material/Instagram';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AdminService from '@/app/services/admin';
import {
  UserProfileWithAppearance,
  AppearanceGrade,
  Gender,
  PaginatedResponse
} from '@/app/admin/users/appearance/types';
import { formatDateWithoutTimezoneConversion, formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import { appearanceGradeEventBus } from '@/app/admin/users/appearance/page';
import UserDetailModal, { UserDetail } from './UserDetailModal';
import BulkEmailNotificationModal from './modals/BulkEmailNotificationModal';

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

// 지역 한글 표시 (개별 지역 코드용)
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

interface UserAppearanceTableProps {
  initialFilters?: {
    gender?: Gender;
    appearanceGrade?: AppearanceGrade;
    universityName?: string;
    minAge?: number;
    maxAge?: number;
    searchTerm?: string;
    region?: string;
  };
}

// forwardRef를 사용하여 ref를 전달받을 수 있도록 수정
import { forwardRef, useImperativeHandle } from 'react';

// 타입 선언 (TypeScript 오류 방지)
interface UserAppearanceTableRef {
  handleApplyFilter: (filters: any) => void;
}

const UserAppearanceTable = forwardRef<
  UserAppearanceTableRef,
  UserAppearanceTableProps
>(({ initialFilters }, ref) => {
  const [users, setUsers] = useState<UserProfileWithAppearance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState(initialFilters || {});

  // 등급 설정 상태
  const [selectedUser, setSelectedUser] = useState<UserProfileWithAppearance | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [savingGrade, setSavingGrade] = useState(false);
  const [gradeMenuAnchorEl, setGradeMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);

  // 일괄 등급 설정 상태
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [bulkEditModalOpen, setBulkEditModalOpen] = useState(false);
  const [bulkSelectedGrade, setBulkSelectedGrade] = useState<AppearanceGrade>('UNKNOWN');
  const [savingBulkGrade, setSavingBulkGrade] = useState(false);

  // 일괄 이메일 발송 상태
  const [bulkEmailModalOpen, setBulkEmailModalOpen] = useState(false);

  // 유저 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 대학교 인증 승인 다이얼로그 상태
  const [universityApprovalDialogOpen, setUniversityApprovalDialogOpen] = useState(false);
  const [userToApprove, setUserToApprove] = useState<UserProfileWithAppearance | null>(null);
  const [approvingUniversity, setApprovingUniversity] = useState(false);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await AdminService.userAppearance.getUsersWithAppearanceGrade({
        page: page + 1, // API는 1부터 시작하는 페이지 번호 사용
        limit: rowsPerPage,
        ...filters
      });

      setUsers(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (err: any) {
      console.error('사용자 목록 조회 중 오류:', err);
      setError(err.message || '사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터 또는 페이지 변경 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage, filters]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 필터 적용 핸들러
  const handleApplyFilter = (newFilters: any) => {
    console.log('필터 적용:', newFilters);
    setFilters(newFilters);
    setPage(0); // 필터 변경 시 첫 페이지로 이동
  };

  // ref를 통해 외부에서 접근할 수 있는 함수 노출
  useImperativeHandle(ref, () => {
    console.log('useImperativeHandle 호출됨');
    return {
      handleApplyFilter: (newFilters: any) => {
        console.log('ref를 통한 handleApplyFilter 호출:', newFilters);
        handleApplyFilter(newFilters);
      }
    };
  });

  // 등급 토글 메뉴 열기
  const handleOpenGradeMenu = (event: React.MouseEvent<HTMLElement>, user: UserProfileWithAppearance) => {
    setGradeMenuAnchorEl(event.currentTarget);
    setSelectedUser(user);
    setSelectedGrade(user.appearanceGrade);
    setActiveUserId(user.userId || user.id); // userId가 없으면 id 사용
  };

  // 등급 토글 메뉴 닫기
  const handleCloseGradeMenu = () => {
    setGradeMenuAnchorEl(null);
    setActiveUserId(null);
  };

  // 대학교 인증 승인 다이얼로그 열기
  const handleUniversityVerificationApproval = (userId: string) => {
    const user = users.find(u => (u.userId || u.id) === userId);
    if (user) {
      setUserToApprove(user);
      setUniversityApprovalDialogOpen(true);
    }
  };

  // 대학교 인증 승인 확인 처리
  const handleConfirmUniversityApproval = async () => {
    if (!userToApprove) return;

    try {
      setApprovingUniversity(true);

      await AdminService.userAppearance.approveUniversityVerification(userToApprove.userId || userToApprove.id);

      // 사용자 목록에서 해당 사용자의 인증 상태 즉시 업데이트
      setUsers(prevUsers =>
        prevUsers.map(user =>
          (user.userId || user.id) === (userToApprove.userId || userToApprove.id)
            ? { ...user, isUniversityVerified: true }
            : user
        )
      );

      // 다이얼로그 닫기
      setUniversityApprovalDialogOpen(false);
      setUserToApprove(null);

    } catch (error: any) {
      console.error('대학교 인증 승인 중 오류:', error);
      setError(error.message || '대학교 인증 승인 중 오류가 발생했습니다.');
    } finally {
      setApprovingUniversity(false);
    }
  };

  // 대학교 인증 승인 다이얼로그 닫기
  const handleCloseUniversityApprovalDialog = () => {
    setUniversityApprovalDialogOpen(false);
    setUserToApprove(null);
  };

  // 등급 설정 저장
  const handleSaveGrade = async (newGrade: AppearanceGrade) => {
    console.log('등급 설정 시작:', { newGrade });
    console.log('선택된 사용자:', selectedUser);

    if (!selectedUser) {
      console.error('선택된 사용자가 없습니다.');
      setError('선택된 사용자가 없습니다.');
      return;
    }

    // userId가 없는 경우 id를 사용
    const userId = selectedUser.userId || selectedUser.id;

    if (!userId) {
      console.error('선택된 사용자의 ID가 없습니다.');
      setError('선택된 사용자의 ID가 없습니다.');
      return;
    }

    console.log('등급 설정 파라미터:', { userId, grade: newGrade });

    try {
      setSavingGrade(true);
      await AdminService.userAppearance.setUserAppearanceGrade(userId, newGrade);
      console.log('등급 설정 성공!');

      // 목록 업데이트
      setUsers(users.map(user => {
        const userIdToCompare = user.userId || user.id;
        return userIdToCompare === userId
          ? { ...user, appearanceGrade: newGrade }
          : user;
      }));

      // 등급 변경 이벤트 발생 - 통계 데이터 갱신 트리거
      console.log('등급 변경 이벤트 발생');
      appearanceGradeEventBus.publish();

      handleCloseGradeMenu();
    } catch (err: any) {
      console.error('등급 설정 중 오류:', err);
      setError(err.message || '등급 설정 중 오류가 발생했습니다.');
    } finally {
      setSavingGrade(false);
    }
  };

  // 사용자 선택 핸들러
  const handleSelectUser = (userId: string) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // 모든 사용자 선택/해제 핸들러
  const handleSelectAllUsers = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      // userId가 없으면 id 사용
      setSelectedUsers(users.map(user => user.userId || user.id).filter(Boolean) as string[]);
    }
  };

  // 일괄 등급 설정 모달 열기
  const handleOpenBulkEditModal = () => {
    if (selectedUsers.length === 0) return;
    setBulkEditModalOpen(true);
  };

  // 일괄 등급 설정 모달 닫기
  const handleCloseBulkEditModal = () => {
    setBulkEditModalOpen(false);
  };

  // 일괄 이메일 발송 모달 열기
  const handleOpenBulkEmailModal = () => {
    if (selectedUsers.length === 0) return;
    setBulkEmailModalOpen(true);
  };

  // 일괄 이메일 발송 모달 닫기
  const handleCloseBulkEmailModal = () => {
    setBulkEmailModalOpen(false);
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
      setUserDetailError(error.message || '유저 상세 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 유저 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 일괄 등급 설정 저장
  const handleSaveBulkGrade = async () => {
    if (selectedUsers.length === 0) return;

    try {
      setSavingBulkGrade(true);
      await AdminService.userAppearance.bulkSetUserAppearanceGrade(selectedUsers, bulkSelectedGrade);

      // 목록 업데이트
      setUsers(users.map(user => {
        // userId가 없으면 id 사용
        const userIdentifier = user.userId || user.id;
        return selectedUsers.includes(userIdentifier)
          ? { ...user, appearanceGrade: bulkSelectedGrade }
          : user;
      }));

      // 등급 변경 이벤트 발생 - 통계 데이터 갱신 트리거
      console.log('일괄 등급 변경 이벤트 발생');
      appearanceGradeEventBus.publish();

      // 선택 초기화
      setSelectedUsers([]);
      handleCloseBulkEditModal();
    } catch (err: any) {
      console.error('일괄 등급 설정 중 오류:', err);
      setError(err.message || '일괄 등급 설정 중 오류가 발생했습니다.');
    } finally {
      setSavingBulkGrade(false);
    }
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 일괄 작업 버튼 */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1">
          {selectedUsers.length > 0
            ? `${selectedUsers.length}명의 사용자 선택됨`
            : '사용자를 선택하여 일괄 작업 수행'}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            disabled={selectedUsers.length === 0}
            onClick={handleOpenBulkEditModal}
          >
            일괄 등급 설정
          </Button>
          <Button
            variant="contained"
            color="info"
            disabled={selectedUsers.length === 0}
            onClick={handleOpenBulkEmailModal}
          >
            일괄 이메일 발송
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  checked={users.length > 0 && selectedUsers.length === users.length}
                  onChange={handleSelectAllUsers}
                />
              </TableCell>
              <TableCell>프로필</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>나이/성별</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>대학교</TableCell>
              <TableCell>지역</TableCell>
              <TableCell>대학교 인증</TableCell>
              <TableCell>외모 등급</TableCell>
              <TableCell>인스타그램</TableCell>
              <TableCell>가입일</TableCell>
              <TableCell>마지막 접속</TableCell>
              <TableCell>마지막 알림 발송</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1">조회된 사용자가 없습니다.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow
                  key={user.userId || user.id}
                  sx={{
                    bgcolor: user.statusAt === 'instagramerror' ? 'rgba(255, 235, 230, 0.5)' : 'inherit'
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedUsers.includes(user.userId || user.id)}
                      onChange={() => handleSelectUser(user.userId || user.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={user.profileImageUrl || user.profileImages?.[0]?.url ||
                           (user.gender === 'MALE'
                            ? `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 50) + 1}.jpg`
                            : `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 50) + 1}.jpg`)}
                      alt={user.name}
                      sx={{
                        width: 40,
                        height: 40,
                        cursor: 'pointer',
                        '&:hover': {
                          boxShadow: '0 0 0 2px #3f51b5'
                        }
                      }}
                      onClick={() => handleOpenUserDetailModal(user.id)}
                    >
                      {user.name?.charAt(0) || '?'}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.name}</Typography>
                    {user.email && (
                      <Typography variant="caption" color="textSecondary">{user.email}</Typography>
                    )}
                  </TableCell>
                  <TableCell>{user.age}세 / {GENDER_LABELS[user.gender]}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.phoneNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {/* 대학교 정보 표시 (여러 필드 구조 지원) */}
                    {user.university ? (
                      // 새로운 university 필드가 있는 경우 (문자열 또는 객체)
                      typeof user.university === 'string' ? (
                        // university가 문자열인 경우 (새로운 API 응답)
                        <Typography variant="body2">
                          {user.university}
                        </Typography>
                      ) : (
                        // university가 객체인 경우 (이전 API 응답)
                        <Tooltip title={`${user.university.name} (${user.university.emailDomain || ''})`}>
                          <Typography variant="body2">
                            {user.university.name}
                            {user.university.isVerified && (
                              <span style={{ marginLeft: '4px', color: '#2ECC71' }}>✓</span>
                            )}
                          </Typography>
                        </Tooltip>
                      )
                    ) : user.universityDetails ? (
                      // 기존 universityDetails 필드가 있는 경우
                      <Tooltip title={`${user.universityDetails.name} (${user.universityDetails.emailDomain || ''})`}>
                        <Typography variant="body2">
                          {user.universityDetails.name}
                          {user.universityDetails.isVerified && (
                            <span style={{ marginLeft: '4px', color: '#2ECC71' }}>✓</span>
                          )}
                        </Typography>
                      </Tooltip>
                    ) : user.universityName ? (
                      // universityName 필드만 있는 경우
                      <Typography variant="body2">
                        {user.universityName}
                      </Typography>
                    ) : (
                      // 대학교 정보가 없는 경우
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {getRegionLabel(user.region)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {user.isUniversityVerified ? (
                        <Chip
                          label="✓ 인증됨"
                          size="small"
                          sx={{
                            bgcolor: '#e8f5e8',
                            color: '#2e7d32',
                            fontWeight: 'medium'
                          }}
                        />
                      ) : (
                        <>
                          <Chip
                            label="미인증"
                            size="small"
                            sx={{
                              bgcolor: '#fff3cd',
                              color: '#856404',
                              fontWeight: 'medium'
                            }}
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            sx={{
                              minWidth: 'auto',
                              px: 1,
                              py: 0.5,
                              fontSize: '0.75rem',
                              borderColor: '#1976d2',
                              color: '#1976d2',
                              '&:hover': {
                                bgcolor: '#e3f2fd',
                                borderColor: '#1565c0'
                              }
                            }}
                            onClick={() => handleUniversityVerificationApproval(user.userId || user.id)}
                          >
                            인증 처리
                          </Button>
                        </>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ position: 'relative' }}>
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
                  </TableCell>
                  <TableCell>
                    {user.instagramId ? (
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <InstagramIcon sx={{ mr: 0.5, color: '#E1306C' }} fontSize="small" />
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Link
                              href={user.instagramUrl || `https://instagram.com/${user.instagramId}`}
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

                            {user.statusAt === 'instagramerror' && (
                              <Chip
                                label="인스타그램 오류"
                                size="small"
                                color="error"
                                sx={{ ml: 1, height: 20, fontSize: '0.625rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {formatDateWithoutTimezoneConversion(user.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {user.lastActiveAt ? formatDateTimeWithoutTimezoneConversion(user.lastActiveAt) : '접속 기록 없음'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {(user as any).lastPushNotificationAt ?
                        formatDateTimeWithoutTimezoneConversion((user as any).lastPushNotificationAt) :
                        '알림 발송 기록 없음'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {/* 작업 버튼 제거 */}
                  </TableCell>
                </TableRow>
              ))
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
        rowsPerPageOptions={[5, 10, 25, 50]}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
      />

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

      {/* 일괄 등급 설정 모달 */}
      <Dialog open={bulkEditModalOpen} onClose={handleCloseBulkEditModal}>
        <DialogTitle>일괄 외모 등급 설정</DialogTitle>
        <DialogContent>
          <Box sx={{ minWidth: 300, pt: 1 }}>
            <Typography variant="body1" sx={{ mb: 2 }}>
              선택한 {selectedUsers.length}명의 사용자에게 적용할 외모 등급을 선택하세요.
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel id="bulk-grade-select-label">외모 등급</InputLabel>
              <Select
                labelId="bulk-grade-select-label"
                value={bulkSelectedGrade}
                label="외모 등급"
                onChange={(e) => setBulkSelectedGrade(e.target.value as AppearanceGrade)}
              >
                <MenuItem value="S">S등급</MenuItem>
                <MenuItem value="A">A등급</MenuItem>
                <MenuItem value="B">B등급</MenuItem>
                <MenuItem value="C">C등급</MenuItem>
                <MenuItem value="UNKNOWN">미분류</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBulkEditModal} disabled={savingBulkGrade}>취소</Button>
          <Button
            onClick={handleSaveBulkGrade}
            variant="contained"
            color="primary"
            disabled={savingBulkGrade}
          >
            {savingBulkGrade ? <CircularProgress size={24} /> : '일괄 적용'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 일괄 이메일 발송 모달 */}
      <BulkEmailNotificationModal
        open={bulkEmailModalOpen}
        onClose={handleCloseBulkEmailModal}
        userIds={selectedUsers}
        onSuccess={() => {
          // 데이터 새로고침
          fetchUsers();
          // 선택 초기화
          setSelectedUsers([]);
        }}
      />

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
            fetchUsers();
          }}
        />
      )}

      {/* 대학교 인증 승인 확인 다이얼로그 */}
      <Dialog
        open={universityApprovalDialogOpen}
        onClose={handleCloseUniversityApprovalDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          대학교 인증 승인
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            <strong>{userToApprove?.name}</strong>님의 대학교 인증을 승인하시겠습니까?
          </Typography>
          {userToApprove && (
            <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                사용자 정보
              </Typography>
              <Typography variant="body2">
                • 이름: {userToApprove.name}
              </Typography>
              <Typography variant="body2">
                • 대학교: {
                  typeof userToApprove.university === 'string'
                    ? userToApprove.university
                    : userToApprove.university?.name || userToApprove.universityDetails?.name || '-'
                }
              </Typography>
              <Typography variant="body2">
                • 전화번호: {userToApprove.phoneNumber || '-'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseUniversityApprovalDialog}
            disabled={approvingUniversity}
          >
            취소
          </Button>
          <Button
            onClick={handleConfirmUniversityApproval}
            variant="contained"
            color="primary"
            disabled={approvingUniversity}
            startIcon={approvingUniversity ? <CircularProgress size={16} /> : null}
          >
            {approvingUniversity ? '승인 중...' : '예, 승인합니다'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});

export default UserAppearanceTable;
