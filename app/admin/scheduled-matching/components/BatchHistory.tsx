'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Tooltip,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { scheduledMatchingService } from '../service';
import type { Country, BatchHistory as BatchHistoryType, BatchStatus } from '../types';
import { formatDateTime, formatDuration } from '../utils';
import BatchDetailModal from './BatchDetailModal';

const STATUS_CONFIG: Record<BatchStatus, { label: string; color: 'success' | 'info' | 'error' | 'warning' }> = {
  completed: { label: '완료', color: 'success' },
  running: { label: '실행 중', color: 'info' },
  failed: { label: '실패', color: 'error' },
  cancelled: { label: '취소됨', color: 'warning' },
};

export default function BatchHistory() {
  const [countryFilter, setCountryFilter] = useState<'ALL' | Country>('ALL');
  const [batches, setBatches] = useState<BatchHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (countryFilter === 'ALL') {
        const [krBatches, jpBatches] = await Promise.all([
          scheduledMatchingService.getBatchesByCountry('KR', 50, 0),
          scheduledMatchingService.getBatchesByCountry('JP', 50, 0),
        ]);
        const allBatches = [...krBatches, ...jpBatches].sort(
          (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
        setBatches(allBatches);
      } else {
        const data = await scheduledMatchingService.getBatchesByCountry(countryFilter, 50, 0);
        setBatches(data);
      }
    } catch (err) {
      console.error('Failed to fetch batches:', err);
      setError('배치 히스토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [countryFilter]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getSuccessRate = (batch: BatchHistoryType): string => {
    if (batch.totalUsers === 0) return '-';
    return `${((batch.successCount / batch.totalUsers) * 100).toFixed(1)}%`;
  };

  const paginatedBatches = batches.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">배치 히스토리</Typography>
        <Tooltip title="새로고침">
          <IconButton onClick={fetchBatches} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>국가</InputLabel>
            <Select
              value={countryFilter}
              label="국가"
              onChange={(e) => setCountryFilter(e.target.value as 'ALL' | Country)}
            >
              <MenuItem value="ALL">전체</MenuItem>
              <MenuItem value="KR">🇰🇷 한국</MenuItem>
              <MenuItem value="JP">🇯🇵 일본</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.100' }}>
                <TableCell>배치 ID</TableCell>
                <TableCell>국가</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>시작 시간</TableCell>
                <TableCell>소요 시간</TableCell>
                <TableCell align="right">전체</TableCell>
                <TableCell align="right">성공</TableCell>
                <TableCell align="right">실패</TableCell>
                <TableCell align="right">성공률</TableCell>
                <TableCell align="center">상세</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">배치 히스토리가 없습니다.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedBatches.map((batch) => {
                  const statusConfig = STATUS_CONFIG[batch.status];
                  const countryFlag = batch.country === 'KR' ? '🇰🇷' : '🇯🇵';
                  const successRate = parseFloat(getSuccessRate(batch));

                  return (
                    <TableRow key={batch.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {batch.id.substring(0, 8)}...
                        </Typography>
                      </TableCell>
                      <TableCell>{countryFlag}</TableCell>
                      <TableCell>
                        <Chip
                          label={statusConfig.label}
                          color={statusConfig.color}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(batch.startedAt)}</TableCell>
                      <TableCell>{formatDuration(batch.startedAt, batch.completedAt)}</TableCell>
                      <TableCell align="right">{batch.totalUsers}</TableCell>
                      <TableCell align="right" sx={{ color: 'success.main' }}>
                        {batch.successCount}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'error.main' }}>
                        {batch.failureCount}
                      </TableCell>
                      <TableCell align="right">
                        <Chip
                          label={getSuccessRate(batch)}
                          size="small"
                          color={
                            isNaN(successRate)
                              ? 'default'
                              : successRate >= 90
                              ? 'success'
                              : successRate >= 70
                              ? 'warning'
                              : 'error'
                          }
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="상세 보기">
                          <IconButton
                            size="small"
                            onClick={() => setSelectedBatchId(batch.id)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={batches.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            labelRowsPerPage="페이지당 항목:"
          />
        </TableContainer>
      )}

      <BatchDetailModal
        batchId={selectedBatchId}
        open={!!selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
      />
    </Box>
  );
}
