'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Chip,
  Grid,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import AdminService from '@/app/services/admin';
import UserDetailModal, { UserDetail } from './UserDetailModal';

// 대학교 인증 사용자 타입
interface VerifiedUser {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  universityName: string;
  departmentName: string;
  grade: string;
  studentNumber: string;
  verifiedAt: string;
  createdAt: string;
  gender?: 'MALE' | 'FEMALE';
  profileImageUrl?: string;
  profileImages?: {
    id: string;
    url: string;
    isMain: boolean;
    order: number;
  }[];
  hasPreferences?: boolean; // 프로필 정보 입력 여부
  isLongTermInactive?: boolean; // 장기 미접속자 여부
}

// API 응답 타입
interface VerifiedUsersResponse {
  items: VerifiedUser[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

const VerifiedUsersPanel: React.FC = () => {
  const [users, setUsers] = useState<VerifiedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);
  const [nameFilter, setNameFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');

  // 사용자 상세 모달 상태
  const [userDetailModalOpen, setUserDetailModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 사용자 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response: VerifiedUsersResponse = await AdminService.userAppearance.getVerifiedUsers({
        page: page + 1, // API는 1부터 시작
        limit: rowsPerPage,
        name: nameFilter || undefined,
        university: universityFilter || undefined
      });

      setUsers(response.items);
      setTotalItems(response.meta.totalItems);
    } catch (err: any) {
      console.error('대학교 인증 사용자 조회 중 오류:', err);
      setError(err.message || '대학교 인증 사용자 목록을 불러오는 중 오류가 발생했습니다.');
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

  // 엔터 키 검색
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  // 사용자 상세 모달 열기
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

  // 사용자 상세 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
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
        대학교 인증 사용자 ({totalItems}명)
      </Typography>

      {/* 검색 필터 */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="이름 검색"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="대학교 검색"
              value={universityFilter}
              onChange={(e) => setUniversityFilter(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={loading}
              fullWidth
            >
              검색
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 오류 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 테이블 */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>프로필</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>대학교</TableCell>
              <TableCell>학과</TableCell>
              <TableCell>학년</TableCell>
              <TableCell>학번</TableCell>
              <TableCell>프로필 정보</TableCell>
              <TableCell>접속 상태</TableCell>
              <TableCell>인증일시</TableCell>
              <TableCell>가입일시</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  대학교 인증 사용자가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Avatar
                      src={user.profileImageUrl || user.profileImages?.[0]?.url}
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
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>{user.universityName}</TableCell>
                  <TableCell>{user.departmentName}</TableCell>
                  <TableCell>{user.grade}</TableCell>
                  <TableCell>{user.studentNumber}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.hasPreferences ? "입력 완료" : "미입력"}
                      size="small"
                      sx={{
                        bgcolor: user.hasPreferences ? '#e8f5e8' : '#ffebee',
                        color: user.hasPreferences ? '#2e7d32' : '#c62828',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.isLongTermInactive ? "장기 미접속" : "정상"}
                      size="small"
                      sx={{
                        bgcolor: user.isLongTermInactive ? '#ffebee' : '#e8f5e8',
                        color: user.isLongTermInactive ? '#c62828' : '#2e7d32',
                        fontWeight: 'medium'
                      }}
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.verifiedAt)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={totalItems}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="페이지당 행 수:"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} / ${count !== -1 ? count : `${to}개 이상`}`
        }
      />

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
            // 데이터 새로고침
            fetchUsers();
          }}
        />
      )}
    </Box>
  );
};

export default VerifiedUsersPanel;
