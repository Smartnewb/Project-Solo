'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField
} from '@mui/material';
import AdminService from '@/app/services/admin';
import KeyIcon from '@mui/icons-material/Key';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import RefreshIcon from '@mui/icons-material/Refresh';

interface InactiveUser {
  id: string;
  name: string;
  phoneNumber: string;
  email: string | null;
  updatedAt: string;
  inactiveDuration: string;
  // 임시 패스워드 발급 후 추가되는 필드
  issuedEmail?: string;
  issuedPassword?: string;
}

interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
}

export default function FemaleRetentionPage() {
  const [users, setUsers] = useState<InactiveUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    limit: 20,
    offset: 0
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<InactiveUser | null>(null);

  useEffect(() => {
    fetchInactiveUsers();
  }, [pagination.offset]);

  const fetchInactiveUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await AdminService.femaleRetention.getInactiveUsers(
        pagination.limit,
        pagination.offset
      );

      setUsers(response.data || []);
      setPagination({
        total: response.total || 0,
        limit: response.limit || 20,
        offset: response.offset || 0
      });
    } catch (err: any) {
      console.error('미접속 여성 유저 목록 조회 실패:', err);
      setError(err.response?.data?.message || '유저 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssuePasswordClick = (user: InactiveUser) => {
    setSelectedUser(user);
    setConfirmDialogOpen(true);
  };

  const handleIssuePasswordConfirm = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(selectedUser.id);
      setConfirmDialogOpen(false);

      const response = await AdminService.femaleRetention.issueTemporaryPassword(selectedUser.id);

      if (response.success) {
        // 테이블에서 해당 유저 업데이트
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === selectedUser.id
              ? {
                  ...user,
                  issuedEmail: response.email,
                  issuedPassword: response.password
                }
              : user
          )
        );
        alert(`임시 패스워드가 발급되었습니다.\n\n이메일: ${response.email}\n패스워드: ${response.password}`);
      }
    } catch (err: any) {
      console.error('임시 패스워드 발급 실패:', err);
      alert(err.response?.data?.message || '임시 패스워드 발급에 실패했습니다.');
    } finally {
      setProcessing(null);
      setSelectedUser(null);
    }
  };

  const handleCopyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label}이(가) 클립보드에 복사되었습니다.`);
  };

  const formatInactiveDuration = (duration: string) => {
    // ISO 8601 Duration 파싱 (예: P5DT3H30M)
    const daysMatch = duration.match(/P(\d+)D/);
    const hoursMatch = duration.match(/T(\d+)H/);
    const minutesMatch = duration.match(/(\d+)M/);

    const days = daysMatch ? parseInt(daysMatch[1]) : 0;
    const hours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const minutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    const parts = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);

    return parts.join(' ') || '0분';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && pagination.offset > 0) {
      setPagination(prev => ({
        ...prev,
        offset: Math.max(0, prev.offset - prev.limit)
      }));
    } else if (direction === 'next' && pagination.offset + pagination.limit < pagination.total) {
      setPagination(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }));
    }
  };

  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>유저 목록을 불러오는 중...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">
            여성 유저 리텐션 관리
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            3일 이상 미접속 여성 유저 관리 (총 {pagination.total}명)
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchInactiveUsers}
        >
          새로고침
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>이름</TableCell>
              <TableCell>전화번호</TableCell>
              <TableCell>이메일</TableCell>
              <TableCell>미접속 기간</TableCell>
              <TableCell>마지막 접속</TableCell>
              <TableCell align="center">발급된 정보</TableCell>
              <TableCell align="center">작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="text.secondary" sx={{ py: 4 }}>
                    미접속 여성 유저가 없습니다.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.phoneNumber}</TableCell>
                  <TableCell>
                    {user.email || (
                      <Chip label="미등록" size="small" color="default" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={formatInactiveDuration(user.inactiveDuration)}
                      size="small"
                      color="warning"
                    />
                  </TableCell>
                  <TableCell>{formatDate(user.updatedAt)}</TableCell>
                  <TableCell>
                    {user.issuedEmail && user.issuedPassword ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            이메일:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                            {user.issuedEmail}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyToClipboard(user.issuedEmail!, '이메일')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            패스워드:
                          </Typography>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                            {user.issuedPassword}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyToClipboard(user.issuedPassword!, '패스워드')}
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        미발급
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="임시 패스워드 발급 및 Push 토큰 제거">
                      <span>
                        <Button
                          variant="contained"
                          color="primary"
                          size="small"
                          startIcon={processing === user.id ? <CircularProgress size={16} /> : <KeyIcon />}
                          onClick={() => handleIssuePasswordClick(user)}
                          disabled={processing === user.id}
                        >
                          {processing === user.id ? '처리 중...' : '패스워드 발급'}
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 페이지네이션 */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => handlePageChange('prev')}
          disabled={pagination.offset === 0}
        >
          이전
        </Button>
        <Typography variant="body2" color="text.secondary">
          {currentPage} / {totalPages} 페이지
        </Typography>
        <Button
          variant="outlined"
          onClick={() => handlePageChange('next')}
          disabled={pagination.offset + pagination.limit >= pagination.total}
        >
          다음
        </Button>
      </Box>

      {/* 확인 다이얼로그 */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>임시 패스워드 발급 확인</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {selectedUser && (
              <>
                <strong>{selectedUser.name}</strong> 님에게 임시 패스워드를 발급하시겠습니까?
                <br /><br />
                다음 작업이 수행됩니다:
                <ul>
                  <li>1회성 임시 패스워드 생성 및 설정</li>
                  <li>이메일 주소 생성 (미등록 시)</li>
                  <li>모든 기기의 Push 토큰 제거 (로그아웃 효과)</li>
                </ul>
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>
            취소
          </Button>
          <Button onClick={handleIssuePasswordConfirm} variant="contained" color="primary">
            발급
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
