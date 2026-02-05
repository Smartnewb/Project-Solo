'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Paper,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { scheduledMatchingService } from '../service';
import type { BatchDetailsWithStats, DetailStatus } from '../types';
import { formatDateTime, formatDuration } from '../utils';

interface BatchDetailModalProps {
  batchId: string | null;
  open: boolean;
  onClose: () => void;
}

const DETAIL_STATUS_CONFIG: Record<DetailStatus, { label: string; color: 'success' | 'warning' | 'error' | 'default' }> = {
  success: { label: '성공', color: 'success' },
  no_candidates: { label: '후보 없음', color: 'warning' },
  filter_exhausted: { label: '필터 소진', color: 'warning' },
  error: { label: '오류', color: 'error' },
};

export default function BatchDetailModal({ batchId, open, onClose }: BatchDetailModalProps) {
  const [data, setData] = useState<BatchDetailsWithStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [statusFilter, setStatusFilter] = useState<'ALL' | DetailStatus>('ALL');

  const fetchDetails = useCallback(async () => {
    if (!batchId) return;

    try {
      setLoading(true);
      setError(null);
      const result = await scheduledMatchingService.getBatchDetails(batchId, 100, 0);
      setData(result);
    } catch (err) {
      console.error('Failed to fetch batch details:', err);
      setError('배치 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    if (open && batchId) {
      setPage(0);
      setStatusFilter('ALL');
      fetchDetails();
    }
  }, [open, batchId, fetchDetails]);

  const handleClose = () => {
    setData(null);
    onClose();
  };

  const filteredDetails = data?.details.filter(
    (d) => statusFilter === 'ALL' || d.status === statusFilter
  ) || [];

  const paginatedDetails = filteredDetails.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const failureAnalysis = data?.details.reduce((acc, detail) => {
    if (detail.status !== 'success') {
      acc[detail.status] = (acc[detail.status] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>) || {};

  const batch = data?.batch;
  const countryFlag = batch?.country === 'KR' ? '🇰🇷' : '🇯🇵';

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">배치 상세</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && <Alert severity="error">{error}</Alert>}

        {data && batch && (
          <>
            <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">국가</Typography>
                  <Typography variant="body1">{countryFlag} {batch.country}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">상태</Typography>
                  <Box>
                    <Chip
                      label={batch.status}
                      color={batch.status === 'completed' ? 'success' : batch.status === 'failed' ? 'error' : 'default'}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">시작</Typography>
                  <Typography variant="body2">{formatDateTime(batch.startedAt)}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">완료</Typography>
                  <Typography variant="body2">
                    {batch.completedAt ? formatDateTime(batch.completedAt) : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">소요 시간</Typography>
                  <Typography variant="body2">{formatDuration(batch.startedAt, batch.completedAt)}</Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold">{batch.totalUsers}</Typography>
                  <Typography variant="caption" color="text.secondary">전체</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {batch.successCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">성공</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold" color="error.main">
                    {batch.failureCount}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">실패</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h5" fontWeight="bold">
                    {data.stats.averageProcessingTimeMs.toFixed(0)}ms
                  </Typography>
                  <Typography variant="caption" color="text.secondary">평균 처리 시간</Typography>
                </Box>
              </Box>
            </Paper>

            {Object.keys(failureAnalysis).length > 0 && (
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>실패 원인 분석</Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  {Object.entries(failureAnalysis).map(([status, count]) => {
                    const config = DETAIL_STATUS_CONFIG[status as DetailStatus];
                    const percentage = ((count / batch.failureCount) * 100).toFixed(1);
                    return (
                      <Chip
                        key={status}
                        label={`${config?.label || status}: ${count}명 (${percentage}%)`}
                        color={config?.color || 'default'}
                        variant="outlined"
                      />
                    );
                  })}
                </Box>
              </Paper>
            )}

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="subtitle1">개별 매칭 결과</Typography>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value as 'ALL' | DetailStatus);
                    setPage(0);
                  }}
                >
                  <MenuItem value="ALL">전체</MenuItem>
                  <MenuItem value="success">성공만</MenuItem>
                  <MenuItem value="no_candidates">후보 없음</MenuItem>
                  <MenuItem value="filter_exhausted">필터 소진</MenuItem>
                  <MenuItem value="error">오류</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: 'grey.100' }}>
                    <TableCell>사용자 ID</TableCell>
                    <TableCell>파트너 ID</TableCell>
                    <TableCell>상태</TableCell>
                    <TableCell align="right">점수</TableCell>
                    <TableCell align="right">처리 시간</TableCell>
                    <TableCell>오류 메시지</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedDetails.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <Typography color="text.secondary">결과가 없습니다.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedDetails.map((detail) => {
                      const statusConfig = DETAIL_STATUS_CONFIG[detail.status];
                      return (
                        <TableRow key={detail.id} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                              {detail.userId.substring(0, 8)}...
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {detail.partnerId ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {detail.partnerId.substring(0, 8)}...
                              </Typography>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={statusConfig.label}
                              color={statusConfig.color}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            {detail.selectedScore ? detail.selectedScore.toFixed(2) : '-'}
                          </TableCell>
                          <TableCell align="right">
                            {detail.processingTimeMs ? `${detail.processingTimeMs}ms` : '-'}
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              color="error"
                              sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                              {detail.errorMessage || '-'}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredDetails.length}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 20, 50, 100]}
                labelRowsPerPage="페이지당:"
              />
            </TableContainer>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
