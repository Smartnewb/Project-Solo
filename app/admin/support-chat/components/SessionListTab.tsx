'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Chat as ChatIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import supportChatService from '@/app/services/support-chat';
import type {
  SupportSessionStatus,
  SupportSessionSummary,
  AdminSessionsResponse,
  SupportDomain,
} from '@/app/types/support-chat';
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_COLORS,
  LANGUAGE_FLAGS,
  DOMAIN_LABELS,
  DOMAIN_COLORS,
} from '@/app/types/support-chat';
import ChatDetailDialog from './ChatDetailDialog';

interface SessionListTabProps {
  statusFilter?: SupportSessionStatus;
}

export default function SessionListTab({ statusFilter }: SessionListTabProps) {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<SupportSessionSummary[]>([]);
  const [error, setError] = useState<string>('');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);

  const [domainFilter, setDomainFilter] = useState<SupportDomain | 'all'>('all');

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const response: AdminSessionsResponse = await supportChatService.getSessions({
        status: statusFilter,
        page: page + 1,
        limit: rowsPerPage,
      });

      let filteredSessions = response.sessions;
      if (domainFilter !== 'all') {
        filteredSessions = filteredSessions.filter((session) => session.domain === domainFilter);
      }

      setSessions(filteredSessions);
      setTotalCount(response.pagination.total);
    } catch (err) {
      console.error('세션 목록 조회 실패:', err);
      setError(err instanceof Error ? err.message : '세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page, rowsPerPage, domainFilter]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenChat = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setChatDialogOpen(true);
  };

  const handleCloseChat = () => {
    setChatDialogOpen(false);
    setSelectedSessionId(null);
  };

  const handleSessionUpdated = () => {
    fetchSessions();
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

  const truncateMessage = (message?: string, maxLength = 50) => {
    if (!message) return '-';
    return message.length > maxLength ? `${message.substring(0, maxLength)}...` : message;
  };

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
            {statusFilter ? SESSION_STATUS_LABELS[statusFilter] : '전체'} 세션 목록
          </Typography>
          <Button
            variant="outlined"
            onClick={fetchSessions}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <RefreshIcon />}
          >
            새로고침
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label="전체"
            onClick={() => setDomainFilter('all')}
            color={domainFilter === 'all' ? 'primary' : 'default'}
            size="small"
            variant={domainFilter === 'all' ? 'filled' : 'outlined'}
          />
          {(['payment', 'matching', 'chat', 'account', 'other'] as SupportDomain[]).map((domain) => (
            <Chip
              key={domain}
              label={DOMAIN_LABELS[domain]}
              onClick={() => setDomainFilter(domain)}
              color={domainFilter === domain ? DOMAIN_COLORS[domain] : 'default'}
              size="small"
              variant={domainFilter === domain ? 'filled' : 'outlined'}
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>세션 ID</TableCell>
              <TableCell>사용자</TableCell>
              <TableCell>상태</TableCell>
              <TableCell>언어</TableCell>
              <TableCell>도메인</TableCell>
              <TableCell>메시지 수</TableCell>
              <TableCell>마지막 메시지</TableCell>
              <TableCell>생성일</TableCell>
              <TableCell>작업</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">세션이 없습니다.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.sessionId} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {session.sessionId.substring(0, 8)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {session.userNickname || session.userId.substring(0, 8)}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={SESSION_STATUS_LABELS[session.status]}
                      color={SESSION_STATUS_COLORS[session.status]}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={session.language === 'ko' ? '한국어' : '日本語'}>
                      <span style={{ fontSize: '1.2rem' }}>
                        {LANGUAGE_FLAGS[session.language]}
                      </span>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    {session.domain ? (
                      <Chip
                        label={DOMAIN_LABELS[session.domain]}
                        color={DOMAIN_COLORS[session.domain]}
                        size="small"
                        sx={{ fontSize: '0.75rem' }}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{session.messageCount}</Typography>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={session.lastMessage || ''}>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {truncateMessage(session.lastMessage)}
                      </Typography>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatDate(session.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenChat(session.sessionId)}
                      title="채팅 보기"
                    >
                      <ChatIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={totalCount}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="페이지당 행 수:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
        />
      </TableContainer>

      {selectedSessionId && (
        <ChatDetailDialog
          open={chatDialogOpen}
          sessionId={selectedSessionId}
          onClose={handleCloseChat}
          onSessionUpdated={handleSessionUpdated}
        />
      )}
    </Box>
  );
}
