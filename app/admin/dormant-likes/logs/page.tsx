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
  CircularProgress,
  Alert,
  Chip,
  Pagination,
  TextField,
  Tooltip,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import AdminService from '@/app/services/admin';
import type { ActionLogsResponse, ActionLogResponse } from '@/types/admin';

export default function DormantLikesLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ActionLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState({
    adminUserId: '',
    dormantUserId: '',
    batchId: '',
  });

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');

      const cleanFilters: any = {};
      if (filters.adminUserId) cleanFilters.adminUserId = filters.adminUserId;
      if (filters.dormantUserId) cleanFilters.dormantUserId = filters.dormantUserId;
      if (filters.batchId) cleanFilters.batchId = filters.batchId;

      const data = await AdminService.dormantLikes.getActionLogs(page, 20, cleanFilters);
      setLogs(data.items);
      setTotalPages(Math.ceil(data.meta.totalItems / data.meta.itemsPerPage));
      setTotalItems(data.meta.totalItems);
    } catch (err: any) {
      setError(err.response?.data?.message || '이력을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const handleFilterChange = (field: string, value: string) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleFilterApply = () => {
    setPage(1);
    fetchLogs();
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

  const formatDuration = (minutes: number) => {
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    const mins = minutes % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}일`);
    if (hours > 0) parts.push(`${hours}시간`);
    if (mins > 0) parts.push(`${mins}분`);

    return parts.join(' ') || '0분';
  };

  const truncateBatchId = (batchId: string) => {
    return batchId.slice(0, 8);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          처리 이력
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          파묘 계정 좋아요 처리 이력을 조회합니다.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* 필터 */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="배치 ID"
          value={filters.batchId}
          onChange={(e) => handleFilterChange('batchId', e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleFilterApply()}
          size="small"
          placeholder="UUID"
          sx={{ minWidth: 200 }}
        />
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        총 {totalItems}건의 처리 이력
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : logs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">처리 이력이 없습니다.</Typography>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>처리일시</TableCell>
                  <TableCell>처리자</TableCell>
                  <TableCell>파묘 계정</TableCell>
                  <TableCell align="center">처리 유형</TableCell>
                  <TableCell>경과시간</TableCell>
                  <TableCell>배치 ID</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell>{formatDate(log.createdAt)}</TableCell>
                    <TableCell>{log.adminUserName}</TableCell>
                    <TableCell>{log.dormantUserName}</TableCell>
                    <TableCell align="center">
                      {log.actionType === 'VIEW' ? (
                        <Chip label="조회" size="small" sx={{ bgcolor: '#3b82f6', color: 'white' }} />
                      ) : (
                        <Chip label="거절" size="small" sx={{ bgcolor: '#ef4444', color: 'white' }} />
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(log.delayMinutes)}</TableCell>
                    <TableCell>
                      <Tooltip title={log.batchId}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: 'monospace',
                            fontSize: '0.75rem',
                            cursor: 'help',
                          }}
                        >
                          {truncateBatchId(log.batchId)}...
                        </Typography>
                      </Tooltip>
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
  );
}
