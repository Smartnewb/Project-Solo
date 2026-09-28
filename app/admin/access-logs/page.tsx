'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AdminService from '@/app/services/admin';
import type {
  AdminAccessLogItem,
  AdminAccessLogListParams,
  AdminAccessLogMethod,
} from '@/app/services/admin';
import { getAdminErrorMessage } from '@/shared/lib/http/admin-fetch';

const LIMIT = 50;
const METHODS: AdminAccessLogMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

interface Filters {
  adminUserId: string;
  targetUserId: string;
  method: '' | AdminAccessLogMethod;
  pathContains: string;
  from: string;
  to: string;
}

const EMPTY_FILTERS: Filters = {
  adminUserId: '',
  targetUserId: '',
  method: '',
  pathContains: '',
  from: '',
  to: '',
};

function formatKst(value: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function adminLabel(log: AdminAccessLogItem): string {
  if (log.adminName && log.adminEmail) return `${log.adminName} (${log.adminEmail})`;
  return log.adminName ?? log.adminEmail ?? log.adminUserId;
}

export default function AccessLogsPage() {
  const [draftFilters, setDraftFilters] = useState<Filters>(EMPTY_FILTERS);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [items, setItems] = useState<AdminAccessLogItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AdminAccessLogListParams = {
        page,
        limit: LIMIT,
        adminUserId: filters.adminUserId.trim() || undefined,
        targetUserId: filters.targetUserId.trim() || undefined,
        method: filters.method || undefined,
        pathContains: filters.pathContains.trim() || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
      };
      const data = await AdminService.accessLogs.getList(params);
      setItems(data.items);
      setTotal(data.total);
    } catch (fetchError) {
      setError(getAdminErrorMessage(fetchError, '개인정보 접속기록을 불러오지 못했습니다.'));
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setFilters(draftFilters);
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight={700}>
        개인정보 접속기록
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        관리자가 회원 개인정보를 조회·수정한 기록입니다. 2년 보관되며 월 1회 이상 점검해야 합니다.
      </Typography>

      <Paper component="form" variant="outlined" onSubmit={handleSubmit} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField size="small" label="관리자 user id" value={draftFilters.adminUserId} onChange={(event) => setDraftFilters((current) => ({ ...current, adminUserId: event.target.value }))} />
          <TextField size="small" label="대상 회원 id" value={draftFilters.targetUserId} onChange={(event) => setDraftFilters((current) => ({ ...current, targetUserId: event.target.value }))} />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>메서드</InputLabel>
            <Select label="메서드" value={draftFilters.method} onChange={(event) => setDraftFilters((current) => ({ ...current, method: event.target.value as Filters['method'] }))}>
              <MenuItem value="">전체</MenuItem>
              {METHODS.map((method) => <MenuItem key={method} value={method}>{method}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="경로 포함" value={draftFilters.pathContains} onChange={(event) => setDraftFilters((current) => ({ ...current, pathContains: event.target.value }))} />
          <TextField size="small" type="date" label="시작일" value={draftFilters.from} onChange={(event) => setDraftFilters((current) => ({ ...current, from: event.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField size="small" type="date" label="종료일" value={draftFilters.to} onChange={(event) => setDraftFilters((current) => ({ ...current, to: event.target.value }))} InputLabelProps={{ shrink: true }} />
          <Button type="submit" variant="contained">조회</Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: '#f9fafb' }}>
              {['시각', '관리자', '메서드', '경로', '대상 회원 id', '결과', 'IP'].map((heading) => (
                <TableCell key={heading} sx={{ fontWeight: 600 }}>{heading}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>접속기록이 없습니다.</TableCell></TableRow>
            ) : items.map((log) => (
              <TableRow key={log.id} hover>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatKst(log.createdAt)}</TableCell>
                <TableCell>{adminLabel(log)}</TableCell>
                <TableCell>{log.method}</TableCell>
                <TableCell sx={{ maxWidth: 440, wordBreak: 'break-all' }}>{log.route ?? log.path}</TableCell>
                <TableCell>{log.targetUserId ?? '-'}</TableCell>
                <TableCell>{log.statusCode ?? '-'}</TableCell>
                <TableCell>{log.ip ?? '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary">총 {total.toLocaleString()}건 · {page}/{totalPages} 페이지</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" disabled={loading || page <= 1} onClick={() => setPage((current) => current - 1)}>이전</Button>
          <Button variant="outlined" disabled={loading || page >= totalPages} onClick={() => setPage((current) => current + 1)}>다음</Button>
        </Box>
      </Box>
    </Box>
  );
}
