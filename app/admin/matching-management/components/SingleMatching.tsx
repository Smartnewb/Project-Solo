import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Divider,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Collapse
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import { UserSearchResult, MatchingResult } from '../types';
import AdminService from '@/app/services/admin';

// 매칭 이력 아이템 인터페이스
interface MatchHistoryItem {
  id: string;
  score: number;
  type: string;
  publishedAt: string;
  user: {
    id: string;
    name: string;
    age: number;
    gender: string;
    profileImageUrl?: string;
    universityDetails?: {
      name: string;
      department: string;
    };
  };
  matcher?: {
    id: string;
    name: string;
    age: number;
    gender: string;
    profileImageUrl?: string;
    universityDetails?: {
      name: string;
      department: string;
    };
  };
}

// 매칭 이력 응답 인터페이스
interface MatchHistoryResponse {
  items: MatchHistoryItem[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface SingleMatchingProps {
  selectedUser: UserSearchResult | null;
  matchingLoading: boolean;
  matchingResult: MatchingResult | null;
  processSingleMatching: () => void;
}

const SingleMatching: React.FC<SingleMatchingProps> = ({
  selectedUser,
  matchingLoading,
  matchingResult,
  processSingleMatching
}) => {
  // 매칭 이력 관련 상태
  const [showMatchHistory, setShowMatchHistory] = useState<boolean>(false);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit, setHistoryLimit] = useState<number>(5);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // 매칭 이력 조회 함수
  const fetchMatchHistory = async () => {
    if (!selectedUser || !selectedDate) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      // AdminService를 사용하여 API 호출
      const data = await AdminService.matching.getMatchHistory(
        formattedDate,
        historyPage,
        historyLimit,
        selectedUser.name
      );

      console.log('매칭 이력 조회 응답:', data);
      setMatchHistory(data);
    } catch (err: any) {
      console.error('매칭 이력 조회 중 오류:', err);
      setHistoryError(err.response?.data?.message || err.message || '매칭 이력을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 매칭 이력 토글 함수
  const toggleMatchHistory = () => {
    const newState = !showMatchHistory;
    setShowMatchHistory(newState);

    if (newState && !matchHistory) {
      fetchMatchHistory();
    }
  };

  // 페이지 변경 핸들러
  const handlePageChange = (_: unknown, newPage: number) => {
    setHistoryPage(newPage + 1);
  };

  // 페이지당 항목 수 변경 핸들러
  const handleLimitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHistoryLimit(parseInt(event.target.value, 10));
    setHistoryPage(1);
  };

  // 날짜 변경 핸들러
  const handleDateChange = (newDate: Date | null) => {
    setSelectedDate(newDate);
    setHistoryPage(1);
    if (newDate && showMatchHistory) {
      // 날짜가 변경되면 새로운 데이터 로드
      setTimeout(() => fetchMatchHistory(), 0);
    }
  };

  // 검색 버튼 핸들러
  const handleSearch = () => {
    fetchMatchHistory();
  };

  // 페이지 또는 항목 수 변경 시 데이터 다시 로드
  useEffect(() => {
    if (showMatchHistory && selectedDate) {
      fetchMatchHistory();
    }
  }, [historyPage, historyLimit]);

  // 선택된 사용자가 변경되면 매칭 이력 초기화
  useEffect(() => {
    setShowMatchHistory(false);
    setMatchHistory(null);
    setHistoryPage(1);
  }, [selectedUser]);

  return (
    <>
      {/* 선택된 사용자 정보 */}
      {selectedUser && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            선택된 사용자:
          </Typography>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={selectedUser.profileImageUrl} sx={{ mr: 2 }}>
                <PersonIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="body1">
                    {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                  </Typography>
                  {selectedUser.appearanceGrade && (
                    <Chip
                      size="small"
                      label={selectedUser.appearanceGrade}
                      color={
                        selectedUser.appearanceGrade === 'S' ? 'secondary' :
                        selectedUser.appearanceGrade === 'A' ? 'primary' :
                        selectedUser.appearanceGrade === 'B' ? 'success' :
                        selectedUser.appearanceGrade === 'C' ? 'warning' : 'default'
                      }
                      sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                    />
                  )}
                </Box>
                <Typography variant="body2" color="textSecondary">
                  {selectedUser.university ? (
                    typeof selectedUser.university === 'string' ?
                      selectedUser.university :
                      selectedUser.university.name
                  ) : selectedUser.universityDetails?.name ?
                    `${selectedUser.universityDetails.name} ${selectedUser.universityDetails.department || ''}` :
                    '대학 정보 없음'}
                </Typography>
              </Box>
            </Box>
          </Paper>

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={processSingleMatching}
              disabled={matchingLoading}
              sx={{ flex: 1 }}
            >
              {matchingLoading ? <CircularProgress size={24} /> : '매칭 실행'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={toggleMatchHistory}
              startIcon={<HistoryIcon />}
              sx={{ flex: 1 }}
            >
              {showMatchHistory ? '매칭 이력 닫기' : '매칭 이력 보기'}
            </Button>
          </Box>
        </Paper>
      )}

      {/* 매칭 이력 */}
      {selectedUser && (
        <Collapse in={showMatchHistory} timeout="auto" unmountOnExit>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {selectedUser.name}님의 매칭 이력
            </Typography>

            <Box sx={{ mb: 3 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="날짜 선택"
                      value={selectedDate}
                      onChange={handleDateChange}
                      format="yyyy-MM-dd"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'small',
                          helperText: '매칭 내역을 조회할 날짜를 선택하세요'
                        }
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSearch}
                    sx={{ height: 40 }}
                  >
                    조회하기
                  </Button>
                </Box>
              </LocalizationProvider>
            </Box>

            {historyLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}

            {historyError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {historyError}
              </Alert>
            )}

            {!historyLoading && matchHistory && (
              <>
                {matchHistory.items.length > 0 ? (
                  <>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>매칭 ID</TableCell>
                            <TableCell>매칭 점수</TableCell>
                            <TableCell>매칭 타입</TableCell>
                            <TableCell>매칭 발표 시간</TableCell>
                            <TableCell>매칭 상대 정보</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {matchHistory.items.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.id}</TableCell>
                              <TableCell>{item.score.toFixed(1)}</TableCell>
                              <TableCell>
                                <Chip
                                  label={
                                    item.type === 'scheduled' ? '무료 매칭' :
                                    item.type === 'admin' ? '관리자 매칭' :
                                    item.type === 'rematching' ? '유료 매칭' :
                                    item.type
                                  }
                                  color={
                                    item.type === 'scheduled' ? 'primary' :
                                    item.type === 'admin' ? 'warning' :
                                    item.type === 'rematching' ? 'secondary' :
                                    'default'
                                  }
                                  size="small"
                                />
                              </TableCell>
                              <TableCell>
                                {new Date(item.publishedAt).toLocaleString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell>
                                {item.matcher ? (
                                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {item.matcher.profileImageUrl ? (
                                      <Avatar src={item.matcher.profileImageUrl} sx={{ mr: 1, width: 24, height: 24 }} />
                                    ) : (
                                      <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
                                        {item.matcher.name ? item.matcher.name.charAt(0) : '?'}
                                      </Avatar>
                                    )}
                                    <Box>
                                      <Typography variant="body2">{item.matcher.name} ({item.matcher.age}세)</Typography>
                                      {item.matcher.universityDetails && (
                                        <Typography variant="caption" color="text.secondary">
                                          {item.matcher.universityDetails.name} {item.matcher.universityDetails.department}
                                        </Typography>
                                      )}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">매칭 상대 없음</Typography>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* 페이지네이션 */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <TablePagination
                        component="div"
                        count={matchHistory.meta.totalItems}
                        page={matchHistory.meta.currentPage - 1}
                        onPageChange={handlePageChange}
                        rowsPerPage={matchHistory.meta.itemsPerPage}
                        onRowsPerPageChange={handleLimitChange}
                        rowsPerPageOptions={[5, 10, 25]}
                        labelRowsPerPage="페이지당 항목 수"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                      />
                    </Box>
                  </>
                ) : (
                  <Alert severity="info">
                    {selectedUser.name}님의 매칭 이력이 없습니다.
                  </Alert>
                )}
              </>
            )}

            {!historyLoading && !matchHistory && !historyError && (
              <Alert severity="info">
                매칭 이력을 불러오는 중입니다...
              </Alert>
            )}
          </Paper>
        </Collapse>
      )}

      {/* 매칭 결과 */}
      {matchingResult && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            매칭 결과
          </Typography>
          {matchingResult.success ? (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                매칭 성공! 유사도: {(matchingResult.similarity * 100).toFixed(1)}%
              </Alert>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
                {/* 요청자 정보 */}
                <Box sx={{ flex: 1 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        요청자 정보
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={matchingResult.requester.profileImages?.find(img => img.isMain)?.url}
                          sx={{ width: 64, height: 64, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {matchingResult.requester.name} ({matchingResult.requester.age}세)
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {matchingResult.requester.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.requester.rank && ` • ${matchingResult.requester.rank}등급`}
                            {matchingResult.requester.mbti && ` • ${matchingResult.requester.mbti}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2">
                        {matchingResult.requester.universityDetails?.name} {matchingResult.requester.universityDetails?.department}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {matchingResult.requester.universityDetails?.grade} {matchingResult.requester.universityDetails?.studentNumber}
                      </Typography>

                      {/* 선호 조건 */}
                      {matchingResult.requester.preferences && matchingResult.requester.preferences.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            선호 조건:
                          </Typography>
                          {matchingResult.requester.preferences.map((pref, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                {pref.typeName}:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {pref.selectedOptions.map(option => (
                                  <Chip
                                    key={option.id}
                                    label={option.displayName}
                                    size="small"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>

                {/* 매칭 상대 정보 */}
                <Box sx={{ flex: 1 }}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        매칭 상대 정보
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar
                          src={matchingResult.partner.profileImages?.find(img => img.isMain)?.url}
                          sx={{ width: 64, height: 64, mr: 2 }}
                        >
                          <PersonIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="body1">
                            {matchingResult.partner.name} ({matchingResult.partner.age}세)
                          </Typography>
                          <Typography variant="body2" color="textSecondary">
                            {matchingResult.partner.gender === 'MALE' ? '남성' : '여성'}
                            {matchingResult.partner.rank && ` • ${matchingResult.partner.rank}등급`}
                            {matchingResult.partner.mbti && ` • ${matchingResult.partner.mbti}`}
                          </Typography>
                        </Box>
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      <Typography variant="body2">
                        {matchingResult.partner.universityDetails?.name} {matchingResult.partner.universityDetails?.department}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" gutterBottom>
                        {matchingResult.partner.universityDetails?.grade} {matchingResult.partner.universityDetails?.studentNumber}
                      </Typography>

                      {/* 선호 조건 */}
                      {matchingResult.partner.preferences && matchingResult.partner.preferences.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" gutterBottom>
                            선호 조건:
                          </Typography>
                          {matchingResult.partner.preferences.map((pref, index) => (
                            <Box key={index} sx={{ mb: 1 }}>
                              <Typography variant="body2" color="textSecondary">
                                {pref.typeName}:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {pref.selectedOptions.map(option => (
                                  <Chip
                                    key={option.id}
                                    label={option.displayName}
                                    size="small"
                                    sx={{ mb: 0.5 }}
                                  />
                                ))}
                              </Box>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            </>
          ) : (
            <Alert severity="error">
              매칭 실패: {matchingResult.success === false ? '적합한 매칭 상대를 찾을 수 없습니다.' : '알 수 없는 오류가 발생했습니다.'}
            </Alert>
          )}
        </Box>
      )}
    </>
  );
};

export default SingleMatching;
