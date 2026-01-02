'use client';

import { useState, useEffect } from 'react';
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
  Chip,
  Card,
  CardContent,
  Grid,
  Pagination,
  TextField,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type { DormantLikesDashboardResponse, DormantUserResponse } from '@/types/admin';
import PendingLikesModal from './components/PendingLikesModal';

export default function DormantLikesPage() {
  const [dashboardData, setDashboardData] = useState<DormantLikesDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [inactiveDays, setInactiveDays] = useState(7);
  const [selectedUser, setSelectedUser] = useState<DormantUserResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await AdminService.dormantLikes.getDashboard(page, 20, inactiveDays);
      setDashboardData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || '대시보드를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [page, inactiveDays]);

  const handleUserClick = (user: DormantUserResponse) => {
    setSelectedUser(user);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedUser(null);
    fetchDashboard();
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '로그인 기록 없음';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          파묘 계정 좋아요 관리
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          7일 이상 미접속한 구슬 보유 여성 유저의 미확인 좋아요를 대리 처리합니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 통계 카드 */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                전체 미확인 좋아요
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {dashboardData?.totalPendingLikes || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                오늘 처리
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {dashboardData?.todayProcessedCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#ecfdf5' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                오늘 조회
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#10b981' }}>
                {dashboardData?.todayViewedCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: '#fef2f2' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">
                오늘 거절
              </Typography>
              <Typography variant="h4" fontWeight="bold" sx={{ color: '#ef4444' }}>
                {dashboardData?.todayRejectedCount || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 필터 */}
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <TextField
          label="미접속 기준 일수"
          type="number"
          value={inactiveDays}
          onChange={(e) => {
            const value = parseInt(e.target.value);
            if (value >= 1) {
              setInactiveDays(value);
              setPage(1);
            }
          }}
          size="small"
          sx={{ width: 150 }}
          InputProps={{ inputProps: { min: 1 } }}
        />
        <Typography variant="body2" color="text.secondary">
          총 {dashboardData?.totalUsers || 0}명의 파묘 계정
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : !dashboardData || dashboardData.users.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            현재 처리 대기 중인 파묘 계정이 없습니다.
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>이름</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell align="center">구슬</TableCell>
                  <TableCell>마지막 로그인</TableCell>
                  <TableCell align="center">미접속 일수</TableCell>
                  <TableCell align="center">미확인 좋아요</TableCell>
                  <TableCell align="center">처리 상태</TableCell>
                  <TableCell align="center">액션</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.phoneNumber}</TableCell>
                    <TableCell align="center">
                      <Chip label={`${user.gemBalance}개`} size="small" color="primary" />
                    </TableCell>
                    <TableCell>{formatDate(user.lastLoginAt)}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${user.daysSinceLastLogin}일`}
                        size="small"
                        color="warning"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={`${user.pendingLikeCount}개`}
                        size="small"
                        color="secondary"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {user.canProcess ? (
                        <Chip label="처리 가능" size="small" sx={{ bgcolor: '#10b981', color: 'white' }} />
                      ) : (
                        <Chip
                          label={`${user.cooldownRemainingMinutes}분 후`}
                          size="small"
                          color="default"
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUserClick(user)}
                      >
                        상세
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Pagination
              count={dashboardData.totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </>
      )}

      {selectedUser && (
        <PendingLikesModal
          open={modalOpen}
          onClose={handleModalClose}
          user={selectedUser}
        />
      )}
    </Box>
  );
}
