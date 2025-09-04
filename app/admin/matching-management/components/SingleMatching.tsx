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
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format } from 'date-fns';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import WarningIcon from '@mui/icons-material/Warning';
import AddIcon from '@mui/icons-material/Add';
import { UserSearchResult, MatchingResult } from '../types';
import AdminService from '@/app/services/admin';
import { formatDateTimeWithoutTimezoneConversion } from '@/app/utils/formatters';
import axiosServer from '@/utils/axios';

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

// 중복 매칭 확인 응답 인터페이스
interface MatchCountResponse {
  totalCount: number;
  matches: {
    id: string;
    publishedAt: string;
    type: string;
  }[];
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
  const [startDate, setStartDate] = useState<Date | null>(new Date());
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // 중복 매칭 확인 관련 상태
  const [matchCount, setMatchCount] = useState<MatchCountResponse | null>(null);
  const [matchCountLoading, setMatchCountLoading] = useState<boolean>(false);
  const [matchCountError, setMatchCountError] = useState<string | null>(null);

  // 직접 매칭 생성 관련 상태
  const [directMatchDialogOpen, setDirectMatchDialogOpen] = useState<boolean>(false);
  const [targetUserSearch, setTargetUserSearch] = useState<string>('');
  const [targetUserSearchResults, setTargetUserSearchResults] = useState<UserSearchResult[]>([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<UserSearchResult | null>(null);
  const [matchType, setMatchType] = useState<'rematching' | 'scheduled'>('scheduled');
  const [directMatchLoading, setDirectMatchLoading] = useState<boolean>(false);
  const [directMatchError, setDirectMatchError] = useState<string | null>(null);
  const [directMatchResult, setDirectMatchResult] = useState<any>(null);

  // 매칭 이력 조회 함수
  const fetchMatchHistory = async () => {
    if (!selectedUser || !startDate || !endDate) return;

    setHistoryLoading(true);
    setHistoryError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      // AdminService를 사용하여 API 호출
      const data = await AdminService.matching.getMatchHistory(
        formattedStartDate,
        formattedEndDate,
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

  // 시작일 변경 핸들러
  const handleStartDateChange = (newDate: Date | null) => {
    setStartDate(newDate);
    setHistoryPage(1);
    if (newDate && endDate && showMatchHistory) {
      // 날짜가 변경되면 새로운 데이터 로드
      setTimeout(() => fetchMatchHistory(), 0);
    }
  };

  // 종료일 변경 핸들러
  const handleEndDateChange = (newDate: Date | null) => {
    setEndDate(newDate);
    setHistoryPage(1);
    if (startDate && newDate && showMatchHistory) {
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
    if (showMatchHistory && startDate && endDate) {
      fetchMatchHistory();
    }
  }, [historyPage, historyLimit]);

  // 중복 매칭 확인 함수
  const checkMatchCount = async () => {
    if (!matchingResult || !matchingResult.success || !selectedUser) return;

    setMatchCountLoading(true);
    setMatchCountError(null);

    try {
      // 요청자 ID와 매칭 상대 ID로 중복 매칭 여부 확인
      const data = await AdminService.matching.getMatchCount(
        matchingResult.requester.id,
        matchingResult.partner.id
      );

      console.log('중복 매칭 확인 응답:', data);

      // 매칭 이력을 날짜 기준으로 오름차순 정렬 (가장 오래된 매칭이 첫 번째)
      if (data && data.matches && data.matches.length > 0) {
        data.matches.sort((a: { publishedAt: string }, b: { publishedAt: string }) =>
          new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
        );
      }

      setMatchCount(data);
    } catch (err: any) {
      console.error('중복 매칭 확인 중 오류:', err);
      setMatchCountError(err.response?.data?.message || err.message || '중복 매칭 확인 중 오류가 발생했습니다.');
    } finally {
      setMatchCountLoading(false);
    }
  };

  // 매칭 결과가 변경되면 중복 매칭 여부 확인
  useEffect(() => {
    if (matchingResult && matchingResult.success) {
      checkMatchCount();
    } else {
      setMatchCount(null);
    }
  }, [matchingResult]);

  // 선택된 사용자가 변경되면 매칭 이력 초기화
  useEffect(() => {
    setShowMatchHistory(false);
    setMatchHistory(null);
    setHistoryPage(1);
    setStartDate(new Date());
    setEndDate(new Date());
    setMatchCount(null);
  }, [selectedUser]);

  // 타겟 사용자 검색 함수
  const searchTargetUsers = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setTargetUserSearchResults([]);
      return;
    }

    try {
      // 기존 매칭 관리 페이지와 동일한 API 사용
      const response = await axiosServer.get('/admin/users/appearance', {
        params: {
          page: 1,
          limit: 20,
          searchTerm: searchTerm
        }
      });

      console.log('타겟 사용자 검색 응답:', response.data);

      let results = [];
      if (response.data && response.data.items && Array.isArray(response.data.items)) {
        results = response.data.items;
      } else if (response.data && Array.isArray(response.data)) {
        results = response.data;
      }

      setTargetUserSearchResults(results);
    } catch (error: any) {
      console.error('타겟 사용자 검색 중 오류:', error);
      setTargetUserSearchResults([]);
    }
  };

  // 직접 매칭 생성 함수
  const createDirectMatch = async () => {
    if (!selectedUser || !selectedTargetUser) {
      setDirectMatchError('매칭할 사용자들을 모두 선택해주세요.');
      return;
    }

    setDirectMatchLoading(true);
    setDirectMatchError(null);

    try {
      const response = await AdminService.matching.createDirectMatch(
        selectedUser.id,
        selectedTargetUser.id,
        matchType
      );

      console.log('직접 매칭 생성 응답:', response);
      setDirectMatchResult(response);

      // 성공 시 다이얼로그 닫기
      setTimeout(() => {
        setDirectMatchDialogOpen(false);
        resetDirectMatchForm();
      }, 2000);
    } catch (err: any) {
      console.error('직접 매칭 생성 중 오류:', err);
      const errorMessage = err.response?.data?.message ||
                          err.response?.data?.error ||
                          err.message ||
                          '직접 매칭 생성 중 오류가 발생했습니다.';
      setDirectMatchError(errorMessage);
    } finally {
      setDirectMatchLoading(false);
    }
  };

  // 직접 매칭 폼 초기화
  const resetDirectMatchForm = () => {
    setTargetUserSearch('');
    setTargetUserSearchResults([]);
    setSelectedTargetUser(null);
    setMatchType('scheduled');
    setDirectMatchError(null);
    setDirectMatchResult(null);
  };

  // 직접 매칭 다이얼로그 열기
  const openDirectMatchDialog = () => {
    resetDirectMatchForm();
    setDirectMatchDialogOpen(true);
  };

  // 직접 매칭 다이얼로그 닫기
  const closeDirectMatchDialog = () => {
    setDirectMatchDialogOpen(false);
    resetDirectMatchForm();
  };

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
              variant="contained"
              color="success"
              onClick={openDirectMatchDialog}
              startIcon={<AddIcon />}
              sx={{ flex: 1 }}
            >
              수동 매칭 생성
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
                      label="시작일"
                      value={startDate}
                      onChange={handleStartDateChange}
                      format="yyyy-MM-dd"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'small',
                          helperText: '조회 시작일을 선택하세요'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <DatePicker
                      label="종료일"
                      value={endDate}
                      onChange={handleEndDateChange}
                      format="yyyy-MM-dd"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          variant: 'outlined',
                          size: 'small',
                          helperText: '조회 종료일을 선택하세요'
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
                                {formatDateTimeWithoutTimezoneConversion(item.publishedAt)}
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

              {/* 중복 매칭 정보 */}
              {matchCount && (
                <>
                  <Alert
                    severity={matchCount.totalCount > 1 ? "warning" : matchCount.totalCount === 1 ? "success" : "info"}
                    sx={{ mb: 2 }}
                    icon={matchCount.totalCount > 1 ? <WarningIcon /> : undefined}
                  >
                    {matchCount.totalCount === 0
                      ? "이 사용자들은 이전에 매칭된 이력이 없습니다."
                      : matchCount.totalCount === 1
                        ? "이 사용자들은 처음 매칭되었습니다."
                        : `이 사용자들은 이전에 ${matchCount.totalCount}번 매칭된 이력이 있습니다. (재매칭)`}
                  </Alert>

                  {/* 중복 매칭 상세 정보 */}
                  {matchCount.totalCount > 0 && matchCount.matches.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {matchCount.totalCount === 1 ? "첫 매칭 이력:" : "재매칭 이력:"}
                      </Typography>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                              <TableCell>매칭 ID</TableCell>
                              <TableCell>매칭 타입</TableCell>
                              <TableCell>매칭 일시</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {matchCount.matches.map((match, index) => (
                              <TableRow
                                key={match.id}
                                sx={{
                                  backgroundColor: matchCount.totalCount === 1
                                    ? 'rgba(76, 175, 80, 0.08)' // 첫 매칭인 경우 연한 초록색
                                    : index === 0
                                      ? 'rgba(255, 152, 0, 0.08)' // 재매칭 중 첫 번째 매칭은 연한 주황색
                                      : 'inherit' // 나머지는 기본 색상
                                }}
                              >
                                <TableCell>{match.id}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={
                                      match.type === 'scheduled' ? '무료 매칭' :
                                      match.type === 'admin' ? '관리자 매칭' :
                                      match.type === 'rematching' ? '유료 매칭' :
                                      match.type
                                    }
                                    color={
                                      match.type === 'scheduled' ? 'primary' :
                                      match.type === 'admin' ? 'warning' :
                                      match.type === 'rematching' ? 'secondary' :
                                      'default'
                                    }
                                    size="small"
                                  />
                                  {/* 첫 번째 매칭은 항상 "첫 매칭"으로 표시 */}
                                  {index === 0 && (
                                    <Chip
                                      label="첫 매칭"
                                      color="warning"
                                      size="small"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                  {/* 두 번째 이상의 매칭은 순서대로 표시 */}
                                  {index > 0 && (
                                    <Chip
                                      label={`${index + 1}번째 매칭`}
                                      color="default"
                                      size="small"
                                      sx={{ ml: 1 }}
                                    />
                                  )}
                                </TableCell>
                                <TableCell>
                                  {formatDateTimeWithoutTimezoneConversion(match.publishedAt)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  )}
                </>
              )}

              {matchCountLoading && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CircularProgress size={20} />
                  <Typography variant="body2">중복 매칭 여부 확인 중...</Typography>
                </Box>
              )}

              {matchCountError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {matchCountError}
                </Alert>
              )}
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

      {/* 직접 매칭 생성 다이얼로그 */}
      <Dialog
        open={directMatchDialogOpen}
        onClose={closeDirectMatchDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          직접 매칭 생성
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* 요청자 정보 */}
            <Typography variant="subtitle1" gutterBottom>
              매칭 요청자:
            </Typography>
            {selectedUser && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={selectedUser.profileImageUrl} sx={{ mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedUser.name} ({selectedUser.age}세, {selectedUser.gender === 'MALE' ? '남성' : '여성'})
                    </Typography>
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
            )}

            {/* 매칭 타입 선택 */}
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>매칭 타입</InputLabel>
              <Select
                value={matchType}
                label="매칭 타입"
                onChange={(e) => setMatchType(e.target.value as 'rematching' | 'scheduled')}
              >
                <MenuItem value="scheduled">일반 매칭 (scheduled)</MenuItem>
                <MenuItem value="rematching">재매칭 (rematching)</MenuItem>
              </Select>
            </FormControl>

            {/* 타겟 사용자 검색 */}
            <Typography variant="subtitle1" gutterBottom>
              매칭 대상자:
            </Typography>
            <Autocomplete
              options={targetUserSearchResults}
              getOptionLabel={(option) => `${option.name} (${option.age}세, ${option.gender === 'MALE' ? '남성' : '여성'})`}
              value={selectedTargetUser}
              onChange={(_, newValue) => setSelectedTargetUser(newValue)}
              inputValue={targetUserSearch}
              onInputChange={(_, newInputValue) => {
                setTargetUserSearch(newInputValue);
                if (newInputValue.length >= 2) {
                  searchTargetUsers(newInputValue);
                }
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="사용자 검색 (이름 또는 전화번호)"
                  placeholder="최소 2글자 이상 입력하세요"
                  fullWidth
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && targetUserSearchResults.length > 0 && !selectedTargetUser) {
                      e.preventDefault();
                      setSelectedTargetUser(targetUserSearchResults[0]);
                    }
                  }}
                />
              )}
              renderOption={(props, option) => (
                <Box component="li" {...props}>
                  <Avatar src={option.profileImageUrl} sx={{ mr: 2, width: 32, height: 32 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body2">
                      {option.name} ({option.age}세, {option.gender === 'MALE' ? '남성' : '여성'})
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {option.university ? (
                        typeof option.university === 'string' ?
                          option.university :
                          option.university.name
                      ) : option.universityDetails?.name ?
                        `${option.universityDetails.name} ${option.universityDetails.department || ''}` :
                        '대학 정보 없음'}
                    </Typography>
                  </Box>
                </Box>
              )}
              sx={{ mb: 3 }}
            />

            {/* 선택된 타겟 사용자 정보 */}
            {selectedTargetUser && (
              <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  선택된 매칭 대상자:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar src={selectedTargetUser.profileImageUrl} sx={{ mr: 2 }}>
                    <PersonIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="body1">
                      {selectedTargetUser.name} ({selectedTargetUser.age}세, {selectedTargetUser.gender === 'MALE' ? '남성' : '여성'})
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {selectedTargetUser.university ? (
                        typeof selectedTargetUser.university === 'string' ?
                          selectedTargetUser.university :
                          selectedTargetUser.university.name
                      ) : selectedTargetUser.universityDetails?.name ?
                        `${selectedTargetUser.universityDetails.name} ${selectedTargetUser.universityDetails.department || ''}` :
                        '대학 정보 없음'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            )}

            {/* 오류 메시지 */}
            {directMatchError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {directMatchError}
              </Alert>
            )}

            {/* 성공 메시지 */}
            {directMatchResult && (
              <Alert severity="success" sx={{ mb: 2 }}>
                직접 매칭이 성공적으로 생성되었습니다!
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDirectMatchDialog}>
            취소
          </Button>
          <Button
            onClick={createDirectMatch}
            variant="contained"
            disabled={directMatchLoading || !selectedUser || !selectedTargetUser}
          >
            {directMatchLoading ? <CircularProgress size={24} /> : '매칭 생성'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default SingleMatching;
