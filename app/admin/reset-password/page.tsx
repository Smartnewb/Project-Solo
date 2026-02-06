'use client';

import { useState } from 'react';
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  IconButton,
  Pagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AdminService from '@/app/services/admin';

export default function ResetPasswordPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searched, setSearched] = useState(false);

  // 확인 다이얼로그
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [resetLoading, setResetLoading] = useState(false);

  // 결과 다이얼로그
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const searchUsers = async (pageNum: number = 1) => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      setError('');
      setSearched(true);

      const data = await AdminService.forceMatching.searchUsers({
        search: searchQuery.trim(),
        page: pageNum,
        limit: 10,
        status: 'approved',
      });

      setUsers(data.users || data.data || data.items || []);
      const meta = data.pagination || data.meta;
      if (meta) {
        setTotalPages(meta.totalPages || 1);
        setTotalCount(meta.total || meta.totalCount || 0);
      }
      setPage(pageNum);
    } catch (err: any) {
      setError(err.response?.data?.message || '검색 중 오류가 발생했습니다.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchUsers(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (_: any, value: number) => {
    searchUsers(value);
  };

  const handleResetClick = (user: any) => {
    setSelectedUser(user);
    setConfirmDialogOpen(true);
  };

  const confirmReset = async () => {
    if (!selectedUser) return;

    try {
      setResetLoading(true);
      const result = await AdminService.userAppearance.resetPassword(selectedUser.userId || selectedUser.id);
      setTemporaryPassword(result.temporaryPassword || result.data?.temporaryPassword || '');
      setConfirmDialogOpen(false);
      setPasswordDialogOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || '비밀번호 초기화에 실패했습니다.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (temporaryPassword) {
      navigator.clipboard.writeText(temporaryPassword);
      alert('임시 비밀번호가 복사되었습니다.');
    }
  };

  const handlePasswordDialogClose = () => {
    setPasswordDialogOpen(false);
    setTemporaryPassword('');
    setSelectedUser(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          비밀번호 초기화
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          회원의 비밀번호를 초기화하고 임시 비밀번호를 발급합니다.
        </Typography>
      </Box>

      {/* 검색 영역 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="이름, 전화번호, 이메일, ID로 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          sx={{ width: 400 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
        >
          검색
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !searched ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            비밀번호를 초기화할 회원을 검색해주세요.
          </Typography>
        </Box>
      ) : users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">검색 결과가 없습니다.</Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              총 {totalCount}명의 검색 결과
            </Typography>
          </Box>

          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.userId || user.id}>
                    <TableCell>{user.name || '-'}</TableCell>
                    <TableCell>{user.email || '-'}</TableCell>
                    <TableCell>{user.phoneNumber || user.phone_number || '-'}</TableCell>
                    <TableCell>{formatDate(user.createdAt || user.created_at)}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        color="warning"
                        size="small"
                        onClick={() => handleResetClick(user)}
                      >
                        비밀번호 초기화
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>비밀번호 초기화</DialogTitle>
        <DialogContent>
          <DialogContentText>
            <strong>{selectedUser?.name}</strong>님의 비밀번호를 초기화하시겠습니까?
            <br />
            <br />
            초기화 시 임시 비밀번호가 발급되며, 기존 비밀번호는 사용할 수 없게 됩니다.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)} disabled={resetLoading}>
            취소
          </Button>
          <Button
            onClick={confirmReset}
            color="warning"
            variant="contained"
            disabled={resetLoading}
          >
            {resetLoading ? <CircularProgress size={20} /> : '초기화'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 임시 비밀번호 표시 다이얼로그 */}
      <Dialog open={passwordDialogOpen} onClose={handlePasswordDialogClose}>
        <DialogTitle>비밀번호 초기화 완료</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            비밀번호가 성공적으로 초기화되었습니다.
            <br />
            아래 임시 비밀번호를 회원에게 전달해주세요.
          </DialogContentText>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              fullWidth
              label="임시 비밀번호"
              value={temporaryPassword}
              InputProps={{
                readOnly: true,
              }}
            />
            <IconButton onClick={handleCopyPassword} color="primary">
              <ContentCopyIcon />
            </IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePasswordDialogClose} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
