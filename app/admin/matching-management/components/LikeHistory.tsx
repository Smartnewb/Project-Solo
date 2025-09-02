'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  Avatar,
  Grid,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import AdminService from '@/app/services/admin';
import { LikeHistoryResponse } from '../types';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';

const LikeHistory: React.FC = () => {
  // 좋아요 이력 관련 상태
  const [likeHistory, setLikeHistory] = useState<LikeHistoryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(10);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [nameFilter, setNameFilter] = useState<string>('');

  // 사용자 상세 모달 관련 상태
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userDetailModalOpen, setUserDetailModalOpen] = useState<boolean>(false);
  const [userDetail, setUserDetail] = useState<any>(null);
  const [loadingUserDetail, setLoadingUserDetail] = useState<boolean>(false);
  const [userDetailError, setUserDetailError] = useState<string | null>(null);

  // 좋아요 이력 조회
  const fetchLikeHistory = async () => {
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 선택해주세요.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // AdminService를 사용하여 API 호출
      const data = await AdminService.matching.getLikeHistory(
        formattedStartDate,
        formattedEndDate,
        page,
        limit,
        nameFilter.trim() || undefined
      );

      console.log('좋아요 이력 조회 응답:', data);
      setLikeHistory(data);
    } catch (err: any) {
      console.error('좋아요 이력 조회 중 오류:', err);
      setError(err.response?.data?.message || err.message || '좋아요 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 페이지 변경 시 자동 재조회
  useEffect(() => {
    if (likeHistory && startDate && endDate) {
      fetchLikeHistory();
    }
  }, [page]);

  // 사용자 프로필 클릭 핸들러
  const handleUserClick = async (userId: string) => {
    setSelectedUserId(userId);
    setUserDetailModalOpen(true);
    setLoadingUserDetail(true);
    setUserDetailError(null);

    try {
      const response = await AdminService.userAppearance.getUserDetails(userId);
      setUserDetail(response);
    } catch (error: any) {
      console.error('사용자 상세 정보 조회 중 오류:', error);
      setUserDetailError(error.response?.data?.message || error.message || '사용자 정보를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingUserDetail(false);
    }
  };

  // 사용자 상세 모달 닫기
  const handleCloseUserDetailModal = () => {
    setUserDetailModalOpen(false);
    setSelectedUserId(null);
    setUserDetail(null);
    setUserDetailError(null);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // 매칭 상태에 따른 칩 색상
  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'ACCEPTED':
        return 'success';
      case 'REJECTED':
        return 'error';
      case 'EXPIRED':
        return 'default';
      default:
        return 'default';
    }
  };

  // 매칭 상태 한글 표시
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'ACCEPTED':
        return '수락됨';
      case 'REJECTED':
        return '거절됨';
      case 'EXPIRED':
        return '만료됨';
      default:
        return status;
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
        좋아요 이력 조회
      </Typography>

      {/* 검색 조건 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                format="yyyy-MM-dd"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                format="yyyy-MM-dd"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    size: 'small'
                  }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                size="small"
                label="이름 검색"
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                placeholder="보낸 사람 또는 받은 사람 이름"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={fetchLikeHistory}
                disabled={loading}
                sx={{ height: '40px' }}
              >
                조회
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Paper>

      {/* 오류 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 결과 테이블 */}
      {likeHistory && !loading && (
        <>
          <Paper sx={{ mb: 2 }}>
            <Typography variant="subtitle1" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              총 {likeHistory.pagination.totalItems}건의 좋아요 이력
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>보낸 사람</TableCell>
                    <TableCell>받은 사람</TableCell>
                    <TableCell>매칭 상태</TableCell>
                    <TableCell>좋아요 발송일</TableCell>
                    <TableCell>확인일</TableCell>
                    <TableCell>만료 여부</TableCell>
                    <TableCell>인연이 아니였나봐요 클릭 여부</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {likeHistory.items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        조회된 좋아요 이력이 없습니다.
                      </TableCell>
                    </TableRow>
                  ) : (
                    likeHistory.items.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                borderRadius: 1
                              }
                            }}
                            onClick={() => handleUserClick(item.sender.id)}
                          >
                            <Avatar
                              src={item.sender.profileImage}
                              alt={item.sender.name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {item.sender.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{item.sender.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                                borderRadius: 1
                              }
                            }}
                            onClick={() => handleUserClick(item.receiver.id)}
                          >
                            <Avatar
                              src={item.receiver.profileImage}
                              alt={item.receiver.name}
                              sx={{ width: 32, height: 32 }}
                            >
                              {item.receiver.name.charAt(0)}
                            </Avatar>
                            <Typography variant="body2">{item.receiver.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusLabel(item.matchStatus)}
                            color={getStatusChipColor(item.matchStatus) as any}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(item.createdAt)}</TableCell>
                        <TableCell>
                          {item.viewedAt ? formatDate(item.viewedAt) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.isExpired ? '만료됨' : '유효함'}
                            color={item.isExpired ? 'error' : 'success'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={item.isNoShow ? '클릭함' : '클릭 안함'}
                            color={item.isNoShow ? 'warning' : 'default'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* 페이지네이션 */}
          {likeHistory.pagination.totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={likeHistory.pagination.totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* 사용자 상세 정보 모달 */}
      {userDetail && (
        <UserDetailModal
          open={userDetailModalOpen}
          onClose={handleCloseUserDetailModal}
          userId={selectedUserId}
          userDetail={userDetail}
          loading={loadingUserDetail}
          error={userDetailError}
          onRefresh={() => {
            // 데이터 새로고침
            if (selectedUserId) {
              handleUserClick(selectedUserId);
            }
          }}
        />
      )}
    </Box>
  );
};

export default LikeHistory;
