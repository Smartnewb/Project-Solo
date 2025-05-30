'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Chip
} from '@mui/material';
import {
  Search as SearchIcon,
  ConfirmationNumber as TicketIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import axiosServer from '@/utils/axios';
import { UserSearchResult, TicketStatusResponse, TicketActionResponse } from '../types';

interface TicketManagementProps {
  searchTerm: string;
  searchLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  selectedUser: UserSearchResult | null;
  setSearchTerm: (term: string) => void;
  searchUsers: () => void;
  handleUserSelect: (user: UserSearchResult) => void;
}

export default function TicketManagement({
  searchTerm,
  searchLoading,
  error,
  searchResults,
  selectedUser,
  setSearchTerm,
  searchUsers,
  handleUserSelect
}: TicketManagementProps) {
  // 티켓 관련 상태
  const [ticketStatus, setTicketStatus] = useState<TicketStatusResponse | null>(null);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [ticketCount, setTicketCount] = useState<number>(1);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  // 티켓 상태 조회
  const fetchTicketStatus = async (userId: string) => {
    setTicketLoading(true);
    setTicketError(null);
    setActionResult(null);

    try {
      const response = await axiosServer.get(`/admin/tickets/user/${userId}`);
      console.log('티켓 상태 조회 응답:', response.data);
      setTicketStatus(response.data);
    } catch (err: any) {
      console.error('티켓 상태 조회 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '티켓 상태 조회 중 오류가 발생했습니다.';
      setTicketError(errorMessage);
      setTicketStatus(null);
    } finally {
      setTicketLoading(false);
    }
  };

  // 티켓 생성
  const createTickets = async () => {
    if (!selectedUser) {
      setTicketError('사용자를 선택해주세요.');
      return;
    }

    if (ticketCount <= 0) {
      setTicketError('생성할 티켓 개수는 1개 이상이어야 합니다.');
      return;
    }

    setActionLoading(true);
    setTicketError(null);
    setActionResult(null);

    try {
      const response = await axiosServer.post('/admin/tickets', {
        userId: selectedUser.id,
        count: ticketCount
      });

      console.log('티켓 생성 응답:', response.data);
      const result = response.data as TicketActionResponse;

      setActionResult(`성공적으로 ${result.createdCount}개의 티켓을 생성했습니다.`);

      // 티켓 상태 새로고침
      await fetchTicketStatus(selectedUser.id);
    } catch (err: any) {
      console.error('티켓 생성 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '티켓 생성 중 오류가 발생했습니다.';
      setTicketError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 티켓 회수
  const deleteTickets = async () => {
    if (!selectedUser) {
      setTicketError('사용자를 선택해주세요.');
      return;
    }

    if (ticketCount <= 0) {
      setTicketError('회수할 티켓 개수는 1개 이상이어야 합니다.');
      return;
    }

    if (!ticketStatus || ticketStatus.stats.available < ticketCount) {
      setTicketError('회수할 수 있는 티켓이 부족합니다.');
      return;
    }

    setActionLoading(true);
    setTicketError(null);
    setActionResult(null);

    try {
      const response = await axiosServer.delete('/admin/tickets', {
        data: {
          userId: selectedUser.id,
          count: ticketCount
        }
      });

      console.log('티켓 회수 응답:', response.data);
      const result = response.data as TicketActionResponse;

      setActionResult(`성공적으로 ${result.deletedCount}개의 티켓을 회수했습니다.`);

      // 티켓 상태 새로고침
      await fetchTicketStatus(selectedUser.id);
    } catch (err: any) {
      console.error('티켓 회수 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '티켓 회수 중 오류가 발생했습니다.';
      setTicketError(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  // 사용자 선택 시 티켓 상태 자동 조회
  const handleUserSelectWithTicket = (user: UserSearchResult) => {
    handleUserSelect(user);
    fetchTicketStatus(user.id);
  };

  return (
    <Box>
      {/* 사용자 검색 섹션 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          재매칭 티켓 관리
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <TextField
            fullWidth
            label="사용자 이름 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            onClick={searchUsers}
            disabled={searchLoading}
            sx={{ minWidth: 100 }}
          >
            {searchLoading ? <CircularProgress size={24} /> : '검색'}
          </Button>
        </Box>

        {/* 에러 메시지 */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* 검색 결과 */}
        {searchResults.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              검색 결과 ({searchResults.length}명)
            </Typography>
            <Grid container spacing={2}>
              {searchResults.map((user) => (
                <Grid item xs={12} sm={6} md={4} key={user.id}>
                  <Card
                    sx={{
                      cursor: 'pointer',
                      border: selectedUser?.id === user.id ? 2 : 1,
                      borderColor: selectedUser?.id === user.id ? 'primary.main' : 'divider',
                      '&:hover': {
                        boxShadow: 2,
                      },
                    }}
                    onClick={() => handleUserSelectWithTicket(user)}
                  >
                    <CardContent>
                      {/* 프로필 이미지와 기본 정보 */}
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={user.profileImageUrl}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="h6" sx={{ mb: 0.5 }}>
                            {user.name}
                          </Typography>
                          <Typography color="text.secondary" variant="body2">
                            {user.age}세 • {user.gender === 'MALE' ? '남성' : '여성'}
                          </Typography>
                          {user.appearanceGrade && (
                            <Chip
                              size="small"
                              label={user.appearanceGrade}
                              color={
                                user.appearanceGrade === 'S' ? 'secondary' :
                                user.appearanceGrade === 'A' ? 'primary' :
                                user.appearanceGrade === 'B' ? 'info' :
                                'default'
                              }
                              sx={{ mt: 0.5 }}
                            />
                          )}
                        </Box>
                      </Box>

                      {/* 전화번호 */}
                      {user.phoneNumber && (
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <PhoneIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2" color="text.secondary">
                            {user.phoneNumber}
                          </Typography>
                        </Box>
                      )}

                      {/* 대학교 정보 */}
                      {user.universityDetails && (
                        <Typography variant="body2" color="text.secondary">
                          {user.universityDetails.name}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>

      {/* 선택된 사용자 정보 및 티켓 관리 */}
      {selectedUser && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedUser.name}님의 재매칭 티켓 관리
          </Typography>

          {/* 티켓 상태 표시 */}
          {ticketLoading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <CircularProgress size={24} />
              <Typography>티켓 상태를 불러오는 중...</Typography>
            </Box>
          ) : ticketError ? (
            <Alert severity="error" sx={{ mb: 3 }}>
              {ticketError}
            </Alert>
          ) : ticketStatus ? (
            <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TicketIcon color="primary" />
                  <Typography variant="h6">현재 티켓 상태</Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="success.main">
                        {ticketStatus.stats.available}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        사용 가능
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="text.secondary">
                        {ticketStatus.stats.used}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        사용됨
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h4" color="primary.main">
                        {ticketStatus.stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        총 발급
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ) : null}

          {/* 작업 결과 메시지 */}
          {actionResult && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {actionResult}
            </Alert>
          )}

          {/* 티켓 관리 액션 */}
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
            <TextField
              type="number"
              label="티켓 개수"
              value={ticketCount}
              onChange={(e) => setTicketCount(Math.max(1, parseInt(e.target.value) || 1))}
              inputProps={{ min: 1, max: 100 }}
              sx={{ width: 120 }}
            />

            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={createTickets}
              disabled={actionLoading}
              sx={{ minWidth: 120 }}
            >
              {actionLoading ? <CircularProgress size={20} /> : '티켓 생성'}
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<RemoveIcon />}
              onClick={deleteTickets}
              disabled={actionLoading || !ticketStatus || ticketStatus.stats.available === 0}
              sx={{ minWidth: 120 }}
            >
              {actionLoading ? <CircularProgress size={20} /> : '티켓 회수'}
            </Button>
          </Box>

          {ticketStatus && ticketStatus.stats.available === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              * 회수할 수 있는 티켓이 없습니다.
            </Typography>
          )}
        </Paper>
      )}
    </Box>
  );
}
