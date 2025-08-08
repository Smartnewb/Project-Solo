'use client';

import React, { useState } from 'react';
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
  Card,
  CardContent,
  Grid,
  Divider
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import AdminService from '@/app/services/admin';
import { MatcherHistoryResponse, UserSearchResult } from '../types';
import UserDetailModal from '@/components/admin/appearance/UserDetailModal';

interface MatcherHistoryProps {
  searchTerm: string;
  searchLoading: boolean;
  error: string | null;
  searchResults: UserSearchResult[];
  selectedUser: UserSearchResult | null;
  setSearchTerm: (term: string) => void;
  searchUsers: () => void;
  handleUserSelect: (user: UserSearchResult) => void;
}

const MatcherHistory: React.FC<MatcherHistoryProps> = ({
  searchTerm,
  searchLoading,
  error,
  searchResults,
  selectedUser,
  setSearchTerm,
  searchUsers,
  handleUserSelect
}) => {
  // 매칭 상대 이력 관련 상태
  const [matcherHistory, setMatcherHistory] = useState<MatcherHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [requesterNameFilter, setRequesterNameFilter] = useState<string>('');

  // 사용자 프로필 상세 모달 상태
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // 매칭 상대 이력 조회 함수
  const fetchMatcherHistory = async () => {
    if (!selectedUser || !startDate || !endDate) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // AdminService를 사용하여 API 호출
      const data = await AdminService.matching.getMatcherHistory(
        selectedUser.id,
        formattedStartDate,
        formattedEndDate,
        historyPage,
        historyLimit,
        requesterNameFilter.trim() || undefined
      );

      console.log('매칭 상대 이력 조회 응답:', data);
      setMatcherHistory(data);
    } catch (err: any) {
      console.error('매칭 상대 이력 조회 중 오류:', err);
      setHistoryError(err.response?.data?.message || err.message || '매칭 상대 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setHistoryPage(value);
  };

  // 페이지 변경 시 자동으로 데이터 가져오기
  React.useEffect(() => {
    if (selectedUser && startDate && endDate && historyPage > 1) {
      fetchMatcherHistory();
    }
  }, [historyPage]);

  // 검색 실행
  const handleSearch = () => {
    setHistoryPage(1);
    fetchMatcherHistory();
  };

  // 엔터 키 핸들러
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.currentTarget === event.target) {
        if ((event.target as HTMLInputElement).name === 'searchTerm') {
          searchUsers();
        } else if ((event.target as HTMLInputElement).name === 'requesterName') {
          handleSearch();
        }
      }
    }
  };

  // 매칭 타입 표시 함수
  const getMatchTypeLabel = (type: string) => {
    switch (type) {
      case 'scheduled':
        return '무료 매칭';
      case 'admin':
        return '관리자 매칭';
      case 'rematching':
        return '유료 매칭';
      default:
        return type;
    }
  };

  // 매칭 타입 색상 함수
  const getMatchTypeColor = (type: string) => {
    switch (type) {
      case 'scheduled':
        return 'primary';
      case 'admin':
        return 'secondary';
      case 'rematching':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          매칭 상대 이력 조회
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          특정 사용자가 몇 번 매칭 상대로 선택되었는지 조회할 수 있습니다.
        </Typography>

        {/* 사용자 검색 */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            사용자 검색
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              name="searchTerm"
              label="사용자 이름"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Button
              variant="contained"
              onClick={searchUsers}
              disabled={searchLoading || !searchTerm.trim()}
            >
              {searchLoading ? <CircularProgress size={20} /> : '검색'}
            </Button>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 검색 결과 */}
          {searchResults.length > 0 && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                검색 결과
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {searchResults.map((user) => (
                  <Chip
                    key={user.id}
                    label={`${user.name} (${user.age}세, ${user.gender === 'MALE' ? '남' : '여'})`}
                    onClick={() => handleUserSelect(user)}
                    color={selectedUser?.id === user.id ? 'primary' : 'default'}
                    variant={selectedUser?.id === user.id ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </Box>
          )}
        </Box>

        {/* 선택된 사용자 정보 */}
        {selectedUser && (
          <Card sx={{ mb: 3, backgroundColor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                선택된 사용자
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  src={selectedUser.profileImageUrl}
                  sx={{
                    width: 50,
                    height: 50,
                    cursor: 'pointer',
                    '&:hover': { opacity: 0.8 }
                  }}
                  onClick={() => {
                    setSelectedUserId(selectedUser.id);
                    setUserModalOpen(true);
                  }}
                >
                  {selectedUser.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      cursor: 'pointer',
                      color: 'primary.main',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                    onClick={() => {
                      setSelectedUserId(selectedUser.id);
                      setUserModalOpen(true);
                    }}
                  >
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedUser.age}세 · {selectedUser.gender === 'MALE' ? '남성' : '여성'}
                  </Typography>
                  {selectedUser.universityDetails && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.universityDetails.name}
                      {selectedUser.universityDetails.department && ` · ${selectedUser.universityDetails.department}`}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 조회 조건 설정 */}
        {selectedUser && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              조회 조건
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <DatePicker
                  label="시작일"
                  value={startDate}
                  onChange={(newValue) => setStartDate(newValue)}
                  format="yyyy-MM-dd"
                  slotProps={{
                    textField: { size: 'small' }
                  }}
                />
              </Grid>
              <Grid item>
                <DatePicker
                  label="종료일"
                  value={endDate}
                  onChange={(newValue) => setEndDate(newValue)}
                  format="yyyy-MM-dd"
                  slotProps={{
                    textField: { size: 'small' }
                  }}
                />
              </Grid>
              <Grid item>
                <TextField
                  name="requesterName"
                  label="요청자 이름 (선택사항)"
                  value={requesterNameFilter}
                  onChange={(e) => setRequesterNameFilter(e.target.value)}
                  onKeyPress={handleKeyPress}
                  size="small"
                  sx={{ minWidth: 200 }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={historyLoading || !startDate || !endDate}
                >
                  {historyLoading ? <CircularProgress size={20} /> : '조회'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* 매칭 상대 이력 결과 */}
        {selectedUser && (
          <Box>
            {historyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {historyError}
              </Alert>
            )}

            {historyLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {!historyLoading && matcherHistory && (
              <>
                {/* 요약 정보 */}
                <Card sx={{ mb: 3, backgroundColor: '#e3f2fd' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      매칭 상대 이력 요약
                    </Typography>
                    <Typography variant="h4" color="primary" gutterBottom>
                      총 {matcherHistory.totalMatchCount}번
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {matcherHistory.matcherInfo.name}님이 매칭 상대로 선택된 총 횟수
                    </Typography>
                  </CardContent>
                </Card>

                {/* 상세 이력 */}
                {matcherHistory.items.length > 0 ? (
                  <>
                    <Typography variant="subtitle1" gutterBottom>
                      상세 이력 ({matcherHistory.meta.totalItems}건)
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>매칭 ID</TableCell>
                            <TableCell>매칭 점수</TableCell>
                            <TableCell>매칭 타입</TableCell>
                            <TableCell>매칭 발표 시간</TableCell>
                            <TableCell>요청자 정보</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {matcherHistory.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              <TableCell>{item.score.toFixed(1)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={getMatchTypeLabel(item.type)}
                                  color={getMatchTypeColor(item.type) as any}
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {format(new Date(item.publishedAt), 'yyyy-MM-dd HH:mm', { locale: ko })}
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar
                                    src={item.requester.profileImageUrl}
                                    sx={{
                                      width: 30,
                                      height: 30,
                                      cursor: 'pointer',
                                      '&:hover': { opacity: 0.8 }
                                    }}
                                    onClick={() => {
                                      setSelectedUserId(item.requester.id);
                                      setUserModalOpen(true);
                                    }}
                                  >
                                    {item.requester.name.charAt(0)}
                                  </Avatar>
                                  <Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight="medium"
                                      sx={{
                                        cursor: 'pointer',
                                        color: 'primary.main',
                                        '&:hover': { textDecoration: 'underline' }
                                      }}
                                      onClick={() => {
                                        setSelectedUserId(item.requester.id);
                                        setUserModalOpen(true);
                                      }}
                                    >
                                      {item.requester.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {item.requester.age}세 · {item.requester.gender === 'MALE' ? '남' : '여'}
                                    </Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* 페이지네이션 */}
                    {matcherHistory.meta.totalPages > 1 && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                        <Pagination
                          count={matcherHistory.meta.totalPages}
                          page={historyPage}
                          onChange={handlePageChange}
                          color="primary"
                        />
                      </Box>
                    )}
                  </>
                ) : (
                  <Alert severity="info">
                    해당 기간에 매칭 상대로 선택된 이력이 없습니다.
                  </Alert>
                )}
              </>
            )}
          </Box>
        )}
      </Paper>
      {/* 사용자 프로필 상세 모달 */}
      <UserDetailModal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        userId={selectedUserId}
        userDetail={{ id: '', name: '', age: 0, gender: 'MALE', profileImages: [] }}
        loading={false}
        error={null}
      />
    </LocalizationProvider>
  );
};

export default MatcherHistory;
