'use client';

import { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Avatar,
  Tooltip,
  IconButton,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import AdminService from '@/app/services/admin';
import type { LikeDetail, AdminLikesParams, LikeStatus } from '@/types/admin';

type FilterStatus = LikeStatus | 'ALL';
type FilterBoolean = 'ALL' | 'true' | 'false';
type SortBy = 'createdAt' | 'viewedAt' | 'mutualLikeAt';
type SortOrder = 'asc' | 'desc';

interface Filters {
  status: FilterStatus;
  hasLetter: FilterBoolean;
  isMutualLike: FilterBoolean;
  startDate: Date | null;
  endDate: Date | null;
  sortBy: SortBy;
  sortOrder: SortOrder;
}

export default function LikesManagementPage() {
  const [likes, setLikes] = useState<LikeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState<Filters>({
    status: 'ALL',
    hasLetter: 'ALL',
    isMutualLike: 'ALL',
    startDate: null,
    endDate: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchLikes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: AdminLikesParams = {
        page,
        limit: 20,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      if (filters.status !== 'ALL') {
        params.status = filters.status;
      }
      if (filters.hasLetter !== 'ALL') {
        params.hasLetter = filters.hasLetter === 'true';
      }
      if (filters.isMutualLike !== 'ALL') {
        params.isMutualLike = filters.isMutualLike === 'true';
      }
      if (filters.startDate) {
        params.startDate = filters.startDate.toISOString().split('T')[0];
      }
      if (filters.endDate) {
        params.endDate = filters.endDate.toISOString().split('T')[0];
      }

      const data = await AdminService.likes.getList(params);
      setLikes(data.items);
      setTotalPages(Math.ceil(data.meta.totalItems / data.meta.itemsPerPage));
      setTotalItems(data.meta.totalItems);
    } catch (err: any) {
      setError(err.response?.data?.message || '좋아요 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  const handleFilterChange = <K extends keyof Filters>(field: K, value: Filters[K]) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleSearch = () => {
    setPage(1);
    fetchLikes();
  };

  const handleReset = () => {
    setFilters({
      status: 'ALL',
      hasLetter: 'ALL',
      isMutualLike: 'ALL',
      startDate: null,
      endDate: null,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusChip = (status: LikeStatus) => {
    switch (status) {
      case 'PENDING':
        return <Chip label="대기중" size="small" color="warning" />;
      case 'ACCEPTED':
        return <Chip label="수락" size="small" color="success" />;
      case 'REJECTED':
        return <Chip label="거절" size="small" color="error" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  const renderUserCell = (user: LikeDetail['sender']) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Avatar
        src={user.mainImageUrl || undefined}
        alt={user.name}
        sx={{ width: 40, height: 40 }}
      />
      <Box>
        <Typography variant="body2" fontWeight="medium">
          {user.name} ({user.age})
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {user.university}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box>
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" fontWeight="bold">
              좋아요 관리
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              시스템 내 모든 좋아요를 조회하고 관리합니다.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            전체 {totalItems.toLocaleString()}건
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* 필터 영역 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={filters.status}
                label="상태"
                onChange={(e) => handleFilterChange('status', e.target.value as FilterStatus)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="PENDING">대기중</MenuItem>
                <MenuItem value="ACCEPTED">수락</MenuItem>
                <MenuItem value="REJECTED">거절</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>편지</InputLabel>
              <Select
                value={filters.hasLetter}
                label="편지"
                onChange={(e) => handleFilterChange('hasLetter', e.target.value as FilterBoolean)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="true">있음</MenuItem>
                <MenuItem value="false">없음</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Mutual</InputLabel>
              <Select
                value={filters.isMutualLike}
                label="Mutual"
                onChange={(e) => handleFilterChange('isMutualLike', e.target.value as FilterBoolean)}
              >
                <MenuItem value="ALL">전체</MenuItem>
                <MenuItem value="true">양방향</MenuItem>
                <MenuItem value="false">단방향</MenuItem>
              </Select>
            </FormControl>

            <DatePicker
              label="시작일"
              value={filters.startDate}
              onChange={(value) => handleFilterChange('startDate', value)}
              slotProps={{
                textField: { size: 'small', sx: { width: 150 } },
              }}
            />

            <DatePicker
              label="종료일"
              value={filters.endDate}
              onChange={(value) => handleFilterChange('endDate', value)}
              slotProps={{
                textField: { size: 'small', sx: { width: 150 } },
              }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>정렬기준</InputLabel>
              <Select
                value={filters.sortBy}
                label="정렬기준"
                onChange={(e) => handleFilterChange('sortBy', e.target.value as SortBy)}
              >
                <MenuItem value="createdAt">발송일</MenuItem>
                <MenuItem value="viewedAt">조회일</MenuItem>
                <MenuItem value="mutualLikeAt">Mutual시간</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>정렬순서</InputLabel>
              <Select
                value={filters.sortOrder}
                label="정렬순서"
                onChange={(e) => handleFilterChange('sortOrder', e.target.value as SortOrder)}
              >
                <MenuItem value="desc">최신순</MenuItem>
                <MenuItem value="asc">오래된순</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button variant="contained" onClick={handleSearch}>
                검색
              </Button>
              <Button variant="outlined" onClick={handleReset} startIcon={<RefreshIcon />}>
                초기화
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* 테이블 */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : likes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography color="text.secondary">좋아요 데이터가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 200 }}>보낸 사람</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>받은 사람</TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}>상태</TableCell>
                    <TableCell align="center" sx={{ minWidth: 80 }}>편지</TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}>Mutual</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>발송일</TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}>조회</TableCell>
                    <TableCell align="center" sx={{ minWidth: 80 }}>만료</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {likes.map((like) => (
                    <TableRow key={like.id} hover>
                      <TableCell>{renderUserCell(like.sender)}</TableCell>
                      <TableCell>{renderUserCell(like.forwardUser)}</TableCell>
                      <TableCell align="center">{getStatusChip(like.status)}</TableCell>
                      <TableCell align="center">
                        {like.hasLetter && like.letterContent ? (
                          <Tooltip
                            title={
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: 'white' }}>
                                {like.letterContent}
                              </Typography>
                            }
                            arrow
                            placement="top"
                          >
                            <IconButton size="small" color="primary">
                              <MailOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {like.isMutualLike ? (
                          <Chip label="양방향" size="small" color="success" variant="outlined" />
                        ) : (
                          <Chip label="단방향" size="small" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(like.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        {like.viewedAt ? (
                          <Tooltip title={formatDate(like.viewedAt)}>
                            <Typography variant="body2" color="success.main" sx={{ cursor: 'help' }}>
                              조회됨
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography variant="body2" color="text.disabled">미조회</Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {like.isMatchExpired ? (
                          <Chip label="만료" size="small" color="error" variant="outlined" />
                        ) : (
                          <Chip label="유효" size="small" color="success" variant="outlined" />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          </>
        )}
      </Box>
    </LocalizationProvider>
  );
}
