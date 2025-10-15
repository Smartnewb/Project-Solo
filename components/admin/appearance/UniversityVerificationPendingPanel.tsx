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
  Divider,
  TextField,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TablePagination,
  useMediaQuery,
  useTheme,
  Stack,
  IconButton
} from '@mui/material';
import { Visibility, CheckCircle, Cancel, School } from '@mui/icons-material';
import AdminService from '@/app/services/admin';
import UserDetailModal, { UserDetail } from './UserDetailModal';

interface UniversityVerificationUser {
  id: string;
  name: string;
  age?: number;
  birthday?: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
  universityName: string;
  departmentName: string;
  grade: string;
  studentNumber: string;
  certificateImageUrl: string;
  createdAt: string;
}

interface UniversityVerificationResponse {
  users: UniversityVerificationUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ConfirmDialog {
  open: boolean;
  user: UniversityVerificationUser | null;
  action: 'approve' | 'reject' | null;
}

interface CertificateDialog {
  open: boolean;
  imageUrl: string;
}

export default function UniversityVerificationPendingPanel() {
  const [users, setUsers] = useState<UniversityVerificationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [nameFilter, setNameFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    open: false,
    user: null,
    action: null
  });

  const [certificateDialog, setCertificateDialog] = useState<CertificateDialog>({
    open: false,
    imageUrl: ''
  });

  // 사용자 상세 정보 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: UniversityVerificationResponse = await AdminService.userAppearance.getUniversityVerificationPending({
        page: page + 1, // API는 1부터 시작
        limit: rowsPerPage,
        name: nameFilter || undefined,
        university: universityFilter || undefined
      });

      setUsers(response.users);
      setTotalItems(response.total);
    } catch (err: any) {
      console.error('대학교 인증 신청 사용자 조회 중 오류:', err);
      setError(err.message || '대학교 인증 신청 사용자 목록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 조회
  useEffect(() => {
    fetchUsers();
  }, [page, rowsPerPage]);

  // 페이지 변경 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // 페이지당 행 수 변경 핸들러
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 검색 핸들러
  const handleSearch = () => {
    setPage(0);
    fetchUsers();
  };

  // 검색 초기화 핸들러
  const handleResetSearch = () => {
    setNameFilter('');
    setUniversityFilter('');
    setPage(0);
    setTimeout(() => {
      fetchUsers();
    }, 100);
  };

  // 확인 다이얼로그 열기
  const handleOpenConfirmDialog = (user: UniversityVerificationUser, action: 'approve' | 'reject') => {
    setConfirmDialog({
      open: true,
      user,
      action
    });
  };

  // 확인 다이얼로그 닫기
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({
      open: false,
      user: null,
      action: null
    });
  };

  // 인증서 이미지 다이얼로그 열기
  const handleOpenCertificateDialog = (imageUrl: string) => {
    setCertificateDialog({
      open: true,
      imageUrl
    });
  };

  // 인증서 이미지 다이얼로그 닫기
  const handleCloseCertificateDialog = () => {
    setCertificateDialog({
      open: false,
      imageUrl: ''
    });
  };

  // 사용자 상세 정보 모달 열기
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

  // 사용자 상세 정보 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
  };

  // 승인/거절 처리
  const handleConfirmAction = async () => {
    if (!confirmDialog.user || !confirmDialog.action) return;

    try {
      setActionLoading(confirmDialog.user.id);

      if (confirmDialog.action === 'approve') {
        await AdminService.userAppearance.approveUniversityVerification(confirmDialog.user.id);
      } else {
        await AdminService.userAppearance.rejectUniversityVerification(confirmDialog.user.id);
      }

      // 목록에서 해당 사용자 제거
      setUsers(prev => prev.filter(user => user.id !== confirmDialog.user!.id));
      setTotalItems(prev => prev - 1);

      handleCloseConfirmDialog();
    } catch (err: any) {
      console.error('대학교 인증 처리 중 오류:', err);
      setError(err.message || '대학교 인증 처리 중 오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  // 날짜 포맷팅
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

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        학생증 인증 신청 관리
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 검색 필터 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="이름 검색"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="대학교 검색"
                value={universityFilter}
                onChange={(e) => setUniversityFilter(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  fullWidth={isMobile}
                >
                  검색
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleResetSearch}
                  fullWidth={isMobile}
                >
                  초기화
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 모바일: 카드 레이아웃 */}
      {isMobile ? (
        <Stack spacing={2}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : users.length === 0 ? (
            <Typography align="center" sx={{ p: 3 }}>
              학생증 인증 신청한 사용자가 없습니다.
            </Typography>
          ) : (
            users.map((user) => (
              <Card key={user.id}>
                <CardContent>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Avatar
                      src={user.profileImageUrl}
                      alt={user.name}
                      sx={{ width: 60, height: 60, cursor: 'pointer' }}
                      onClick={() => handleOpenUserDetailModal(user.id)}
                    >
                      {user.name?.charAt(0) || '?'}
                    </Avatar>

                    <Typography variant="h6" align="center">
                      {user.name}
                    </Typography>

                    {(user.birthday || user.age) && (
                      <Typography variant="body2" color="textSecondary" align="center">
                        {user.birthday ? (
                          <>
                            생년월일: {new Date(user.birthday).toLocaleDateString('ko-KR')}
                            {user.age && ` (${user.age}세)`}
                          </>
                        ) : (
                          user.age ? `나이: ${user.age}세` : ''
                        )}
                      </Typography>
                    )}

                    <Typography variant="body2" color="textSecondary" align="center">
                      {user.phoneNumber}
                    </Typography>

                    <Divider sx={{ width: '100%', my: 1 }} />

                    <Typography variant="body2" align="center">
                      <strong>{user.universityName}</strong>
                    </Typography>

                    <Typography variant="body2" color="textSecondary" align="center">
                      {user.departmentName} {user.grade}학년
                    </Typography>

                    <Typography variant="body2" color="textSecondary" align="center">
                      학번: {user.studentNumber}
                    </Typography>

                    <Typography variant="caption" color="textSecondary" align="center">
                      신청일: {formatDate(user.createdAt)}
                    </Typography>

                    <Divider sx={{ width: '100%', my: 1 }} />

                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        variant="outlined"
                        startIcon={<Visibility />}
                        onClick={() => handleOpenCertificateDialog(user.certificateImageUrl)}
                        fullWidth
                        size="small"
                      >
                        학생증 보기
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={1} sx={{ width: '100%' }}>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                        onClick={() => handleOpenConfirmDialog(user, 'approve')}
                        disabled={actionLoading === user.id}
                        fullWidth
                      >
                        승인
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        startIcon={<Cancel />}
                        onClick={() => handleOpenConfirmDialog(user, 'reject')}
                        disabled={actionLoading === user.id}
                        fullWidth
                      >
                        거절
                      </Button>
                    </Stack>
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
                <TableCell>프로필</TableCell>
                <TableCell>이름</TableCell>
                <TableCell>생년월일(나이)</TableCell>
                <TableCell>전화번호</TableCell>
                <TableCell>대학교</TableCell>
                <TableCell>학과</TableCell>
                <TableCell>학년</TableCell>
                <TableCell>학번</TableCell>
                <TableCell>신청일</TableCell>
                <TableCell>보기</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">학생증 인증 신청한 사용자가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <Avatar
                        src={user.profileImageUrl}
                        alt={user.name}
                        sx={{ width: 40, height: 40, cursor: 'pointer' }}
                        onClick={() => handleOpenUserDetailModal(user.id)}
                      >
                        {user.name?.charAt(0) || '?'}
                      </Avatar>
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
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell>{user.universityName}</TableCell>
                    <TableCell>{user.departmentName}</TableCell>
                    <TableCell>{user.grade}학년</TableCell>
                    <TableCell>{user.studentNumber}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <IconButton
                        onClick={() => handleOpenCertificateDialog(user.certificateImageUrl)}
                        color="primary"
                        size="small"
                      >
                        <Visibility />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={<CheckCircle />}
                          onClick={() => handleOpenConfirmDialog(user, 'approve')}
                          disabled={actionLoading === user.id}
                        >
                          승인
                        </Button>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          startIcon={<Cancel />}
                          onClick={() => handleOpenConfirmDialog(user, 'reject')}
                          disabled={actionLoading === user.id}
                        >
                          거절
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <TablePagination
            component="div"
            count={totalItems}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
          />
        </TableContainer>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialog.open} onClose={handleCloseConfirmDialog}>
        <DialogTitle>
          {confirmDialog.action === 'approve' ? '학생증 인증 승인' : '학생증 인증 거절'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmDialog.user?.name}님의 학생증 인증을{' '}
            {confirmDialog.action === 'approve' ? '승인' : '거절'}하시겠습니까?
          </Typography>
          {confirmDialog.user && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="textSecondary">
                대학교: {confirmDialog.user.universityName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                학과: {confirmDialog.user.departmentName}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                학년: {confirmDialog.user.grade}학년
              </Typography>
              <Typography variant="body2" color="textSecondary">
                학번: {confirmDialog.user.studentNumber}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>취소</Button>
          <Button
            onClick={handleConfirmAction}
            color={confirmDialog.action === 'approve' ? 'success' : 'error'}
            variant="contained"
            disabled={actionLoading !== null}
          >
            {actionLoading !== null ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              confirmDialog.action === 'approve' ? '승인' : '거절'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 인증서 이미지 다이얼로그 */}
      <Dialog
        open={certificateDialog.open}
        onClose={handleCloseCertificateDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <School />
            학생증
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <img
              src={certificateDialog.imageUrl}
              alt="학생증"
              style={{
                maxWidth: '100%',
                maxHeight: '70vh',
                objectFit: 'contain'
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCertificateDialog}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 사용자 상세 정보 모달 */}
      {!!userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            fetchUsers();
          }}
        />
      )}
    </Box>
  );
}
