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
  TablePagination,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Message as MessageIcon,
  AccessTime as AccessTimeIcon,
  CheckCircle as CheckCircleIcon,
  Analyze as AnalyzeIcon
} from '@mui/icons-material';
import AdminService from '@/app/services/admin';
import {
  AIChatSession,
  AIChatMessage,
  AIChatSessionsParams,
  AIChatSessionsResponse,
  AIChatMessagesResponse,
  AIChatCategory,
  AIChatSessionStatus
} from './types';
import AIChatMessageDetail from './components/AIChatMessageDetail';

export default function AIChatManagementPage() {
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sessions, setSessions] = useState<AIChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<AIChatSession | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [error, setError] = useState<string>('');

  // 페이지네이션
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // 필터 상태
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [category, setCategory] = useState<AIChatCategory | ''>('');
  const [status, setStatus] = useState<AIChatSessionStatus | ''>('');
  const [isActive, setIsActive] = useState<boolean | ''>('');
  const [userId, setUserId] = useState<string>('');

  // 모달 상태
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false);

  // AI 채팅 세션 목록 조회
  const fetchSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const params: AIChatSessionsParams = {
        page: page + 1,
        limit: rowsPerPage
      };

      if (startDate) {
        params.startDate = startDate.toISOString().split('T')[0];
      }
      if (endDate) {
        params.endDate = endDate.toISOString().split('T')[0];
      }
      if (category) {
        params.category = category;
      }
      if (status) {
        params.status = status;
      }
      if (isActive !== '') {
        params.isActive = isActive;
      }
      if (userId) {
        params.userId = userId;
      }

      const response: AIChatSessionsResponse = await AdminService.aiChat.getSessions(params);
      setSessions(response.sessions);
      setTotalCount(response.total);
    } catch (error: any) {
      console.error('AI 채팅 세션 목록 조회 실패:', error);
      setError(error.message || 'AI 채팅 세션 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 메시지 상세 조회
  const fetchMessages = async (sessionId: string) => {
    setMessagesLoading(true);
    try {
      const response: AIChatMessagesResponse = await AdminService.aiChat.getMessages(sessionId);
      setMessages(response.messages);
      setSelectedSession(response.session);
      setMessagesDialogOpen(true);
    } catch (error: any) {
      console.error('AI 채팅 메시지 조회 실패:', error);
      setError(error.message || '메시지를 불러오는데 실패했습니다.');
    } finally {
      setMessagesLoading(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 상태 색상 및 아이콘
  const getStatusInfo = (status: AIChatSessionStatus) => {
    switch (status) {
      case 'active':
        return { color: 'success' as const, icon: <ChatIcon />, label: '진행 중' };
      case 'completed':
        return { color: 'primary' as const, icon: <CheckCircleIcon />, label: '완료' };
      case 'analyzing':
        return { color: 'warning' as const, icon: <AnalyzeIcon />, label: '분석 중' };
      case 'analyzed':
        return { color: 'info' as const, icon: <CheckCircleIcon />, label: '분석 완료' };
      case 'closed':
        return { color: 'default' as const, icon: <CloseIcon />, label: '종료' };
      default:
        return { color: 'default' as const, icon: <ChatIcon />, label: status };
    }
  };

  // 카테고리 색상
  const getCategoryColor = (category: AIChatCategory) => {
    switch (category) {
      case '일상':
        return 'primary';
      case '인간관계':
        return 'secondary';
      case '진로/학교':
        return 'info';
      case '연애':
        return 'error';
      default:
        return 'default';
    }
  };

  // 페이지네이션 핸들러
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // 필터 초기화
  const resetFilters = () => {
    setStartDate(null);
    setEndDate(null);
    setCategory('');
    setStatus('');
    setIsActive('');
    setUserId('');
    setPage(0);
  };

  // 데이터 새로고침
  const handleRefresh = () => {
    fetchSessions();
  };

  useEffect(() => {
    fetchSessions();
  }, [page, rowsPerPage]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box p={3}>
        <Typography variant="h4" gutterBottom>
          AI 채팅 관리
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 필터 영역 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            필터 옵션
          </Typography>

          <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
            <DatePicker
              label="시작일"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <DatePicker
              label="종료일"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              slotProps={{ textField: { size: 'small' } }}
            />

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>카테고리</InputLabel>
              <Select
                value={category}
                label="카테고리"
                onChange={(e) => setCategory(e.target.value as AIChatCategory | '')}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="일상">일상</MenuItem>
                <MenuItem value="인간관계">인간관계</MenuItem>
                <MenuItem value="진로/학교">진로/학교</MenuItem>
                <MenuItem value="연애">연애</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>상태</InputLabel>
              <Select
                value={status}
                label="상태"
                onChange={(e) => setStatus(e.target.value as AIChatSessionStatus | '')}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value="active">진행 중</MenuItem>
                <MenuItem value="completed">완료</MenuItem>
                <MenuItem value="analyzing">분석 중</MenuItem>
                <MenuItem value="analyzed">분석 완료</MenuItem>
                <MenuItem value="closed">종료</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>활성화</InputLabel>
              <Select
                value={isActive}
                label="활성화"
                onChange={(e) => setIsActive(e.target.value as boolean | '')}
              >
                <MenuItem value="">전체</MenuItem>
                <MenuItem value={true}>활성</MenuItem>
                <MenuItem value={false}>비활성</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="사용자 ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              sx={{ minWidth: 150 }}
            />

            <Button
              variant="contained"
              onClick={fetchSessions}
              disabled={loading}
              startIcon={<RefreshIcon />}
            >
              {loading ? '조회 중...' : '조회'}
            </Button>

            <Button
              variant="outlined"
              onClick={resetFilters}
              startIcon={<RefreshIcon />}
            >
              초기화
            </Button>
          </Box>
        </Paper>

        {/* 세션 목록 테이블 */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>사용자</TableCell>
                  <TableCell>카테고리</TableCell>
                  <TableCell>대화 턴 수</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>활성화</TableCell>
                  <TableCell>생성 시간</TableCell>
                  <TableCell>수정 시간</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : sessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      데이터가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  sessions.map((session) => {
                    const statusInfo = getStatusInfo(session.status);
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              src={session.user.profileImage || undefined}
                              sx={{ width: 32, height: 32 }}
                            >
                              <PersonIcon />
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {session.user.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {session.user.id}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.category}
                            color={getCategoryColor(session.category)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{session.turnCount}</TableCell>
                        <TableCell>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            color={statusInfo.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={session.isActive ? '활성' : '비활성'}
                            color={session.isActive ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatDate(session.createdAt)}</TableCell>
                        <TableCell>{formatDate(session.updatedAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => fetchMessages(session.id)}
                            disabled={messagesLoading}
                            size="small"
                          >
                            <MessageIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[10, 20, 50, 100]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="페이지당 행 수"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}-${to} / ${count !== -1 ? count : `0개 이상`}`
            }
          />
        </Paper>

        {/* 메시지 상세 조회 다이얼로그 */}
        <AIChatMessageDetail
          open={messagesDialogOpen}
          onClose={() => setMessagesDialogOpen(false)}
          session={selectedSession}
          messages={messages}
          loading={messagesLoading}
        />
      </Box>
    </LocalizationProvider>
  );
}