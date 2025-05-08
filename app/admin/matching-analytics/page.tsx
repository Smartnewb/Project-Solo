'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { ADMIN_EMAIL } from '@/utils/config';
import AdminService from '@/app/services/admin';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Avatar,
  Chip,
  TextField
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface MatchingStats {
  totalMatchRate: number;
  maleMatchRate: number;
  femaleMatchRate: number;
  totalRematchRate: number;
  maleRematchRate: number;
  femaleRematchRate: number;
  maleSecondRematchRate: number;
  femaleSecondRematchRate: number;
  maleThirdRematchRate: number;
  femaleThirdRematchRate: number;
}

// 매칭 내역 사용자 프로필 인터페이스
interface UserProfile {
  id: string;
  name: string;
  age: number;
  gender: string;
  profileImageUrl?: string;
  universityDetails?: {
    name: string;
    department: string;
    grade?: string;
    studentNumber?: string;
  };
}

// 매칭 내역 아이템 인터페이스
interface MatchHistoryItem {
  id: string;
  score: number;
  type: string;
  publishedAt: string;
  user: UserProfile;
  matcher?: UserProfile;
}

// 매칭 내역 응답 인터페이스
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

// 매칭 실패 로그 아이템 인터페이스
interface FailureLogItem {
  id: string;
  userId: string;
  userName: string;
  reason: string;
  createdAt: string;
}

// 매칭 실패 로그 응답 인터페이스
interface FailureLogResponse {
  items: FailureLogItem[];
  meta: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// 탭 패널 컴포넌트
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// 차트 색상
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function MatchingAnalytics() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);

  // 매칭 내역 관련 상태
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [matchHistory, setMatchHistory] = useState<MatchHistoryResponse | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [matchType, setMatchType] = useState<string>('all');
  const [isSearchMode, setIsSearchMode] = useState<boolean>(false);

  // 매칭 실패 내역 관련 상태
  const [failureLogs, setFailureLogs] = useState<FailureLogResponse | null>(null);
  const [failureLogsPage, setFailureLogsPage] = useState<number>(1);
  const [failureLogsLimit, setFailureLogsLimit] = useState<number>(10);
  const [failureLogsLoading, setFailureLogsLoading] = useState<boolean>(false);
  const [failureSearchName, setFailureSearchName] = useState<string>('');
  const [isFailureSearchMode, setIsFailureSearchMode] = useState<boolean>(false);

  // 대학교 목록 가져오기
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const data = await AdminService.universities.getUniversities();
        setUniversities(data);
      } catch (err) {
        console.error('대학교 목록 조회 중 오류:', err);
      }
    };

    fetchUniversities();
  }, []);

  // 매칭 통계 가져오기
  useEffect(() => {
    const fetchMatchingStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await AdminService.matching.getMatchingStats(
          selectedPeriod,
          selectedUniversity || undefined
        );

        setMatchingStats(data as MatchingStats);
      } catch (err: any) {
        console.error('매칭 통계 조회 중 오류:', err);
        setError(err.message || '매칭 통계를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchMatchingStats();
  }, [selectedPeriod, selectedUniversity]);

  // 매칭 내역 가져오기
  useEffect(() => {
    const fetchMatchHistory = async () => {
      if (!selectedDate) return;

      try {
        setHistoryLoading(true);
        setError(null);

        // 날짜 형식 변환 (YYYY-MM-DD)
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        // 검색 모드가 아닌 경우에만 자동으로 데이터 가져오기
        if (!isSearchMode) {
          const data = await AdminService.matching.getMatchHistory(
            formattedDate,
            historyPage,
            historyLimit
          );

          setMatchHistory(data);
        }
      } catch (err: any) {
        console.error('매칭 내역 조회 중 오류:', err);
        setError(err.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setHistoryLoading(false);
      }
    };

    // 매칭 내역 탭이 선택된 경우에만 데이터 가져오기
    if (tabValue === 2) {
      fetchMatchHistory();
    }
  }, [selectedDate, historyPage, historyLimit, tabValue, isSearchMode]);

  // 매칭 내역 검색 실행 함수
  const handleSearch = async () => {
    if (!selectedDate) return;

    try {
      setHistoryLoading(true);
      setError(null);
      setHistoryPage(1); // 검색 시 첫 페이지로 이동

      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const data = await AdminService.matching.getMatchHistory(
        formattedDate,
        1,
        historyLimit,
        searchName,
        matchType
      );

      setMatchHistory(data);
      setIsSearchMode(true);
    } catch (err: any) {
      console.error('매칭 내역 검색 중 오류:', err);
      setError(err.message || '매칭 내역을 검색하는 중 오류가 발생했습니다.');
    } finally {
      setHistoryLoading(false);
    }
  };

  // 매칭 실패 내역 가져오기
  useEffect(() => {
    const fetchFailureLogs = async () => {
      if (!selectedDate) return;

      try {
        setFailureLogsLoading(true);
        setError(null);

        // 날짜 형식 변환 (YYYY-MM-DD)
        const formattedDate = format(selectedDate, 'yyyy-MM-dd');

        // 검색 모드가 아닌 경우에만 자동으로 데이터 가져오기
        if (!isFailureSearchMode) {
          const data = await AdminService.matching.getFailureLogs(
            formattedDate,
            failureLogsPage,
            failureLogsLimit
          );

          setFailureLogs(data);
        }
      } catch (err: any) {
        console.error('매칭 실패 내역 조회 중 오류:', err);
        setError(err.message || '매칭 실패 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setFailureLogsLoading(false);
      }
    };

    // 매칭 실패 내역 탭이 선택된 경우에만 데이터 가져오기
    if (tabValue === 3) {
      fetchFailureLogs();
    }
  }, [selectedDate, failureLogsPage, failureLogsLimit, tabValue, isFailureSearchMode]);

  // 매칭 실패 내역 검색 실행 함수
  const handleFailureSearch = async () => {
    if (!selectedDate) return;

    try {
      setFailureLogsLoading(true);
      setError(null);
      setFailureLogsPage(1); // 검색 시 첫 페이지로 이동

      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');

      const data = await AdminService.matching.getFailureLogs(
        formattedDate,
        1,
        failureLogsLimit,
        failureSearchName
      );

      setFailureLogs(data);
      setIsFailureSearchMode(true);
    } catch (err: any) {
      console.error('매칭 실패 내역 검색 중 오류:', err);
      setError(err.message || '매칭 실패 내역을 검색하는 중 오류가 발생했습니다.');
    } finally {
      setFailureLogsLoading(false);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || (user.email !== process.env.NEXT_PUBLIC_DEFAULT_ADMIN_EMAIL && user.email !== ADMIN_EMAIL)) {
    router.push('/');
    return null;
  }

  // 매칭 성과 차트 데이터
  const matchRateChartData = matchingStats ? [
    { name: '전체', value: matchingStats.totalMatchRate },
    { name: '남성', value: matchingStats.maleMatchRate },
    { name: '여성', value: matchingStats.femaleMatchRate }
  ] : [];

  // 재매칭 신청률 차트 데이터
  const rematchRateChartData = matchingStats ? [
    { name: '전체', value: matchingStats.totalRematchRate },
    { name: '남성', value: matchingStats.maleRematchRate },
    { name: '여성', value: matchingStats.femaleRematchRate }
  ] : [];

  // 2차 재매칭 신청률 차트 데이터
  const secondRematchRateChartData = matchingStats ? [
    { name: '남성', value: matchingStats.maleSecondRematchRate },
    { name: '여성', value: matchingStats.femaleSecondRematchRate }
  ] : [];

  // 3차 재매칭 신청률 차트 데이터
  const thirdRematchRateChartData = matchingStats ? [
    { name: '남성', value: matchingStats.maleThirdRematchRate },
    { name: '여성', value: matchingStats.femaleThirdRematchRate }
  ] : [];

  // 통계 카드 컴포넌트
  const StatCard = ({ title, value }: { title: string; value: number }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" color="primary" sx={{ fontWeight: 'bold' }}>
          {value.toFixed(1)}%
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        매칭 분석 대시보드
      </Typography>

      {/* 필터 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>기간 선택</InputLabel>
              <Select
                value={selectedPeriod}
                label="기간 선택"
                onChange={(e) => setSelectedPeriod(e.target.value as 'daily' | 'weekly' | 'monthly')}
              >
                <MenuItem value="daily">일간</MenuItem>
                <MenuItem value="weekly">주간</MenuItem>
                <MenuItem value="monthly">월간</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>대학교 선택</InputLabel>
              <Select
                value={selectedUniversity}
                label="대학교 선택"
                onChange={(e) => setSelectedUniversity(e.target.value)}
              >
                <MenuItem value="">전체</MenuItem>
                {universities.map((university) => (
                  <MenuItem key={university} value={university}>
                    {university}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                setSelectedPeriod('daily');
                setSelectedUniversity('');
              }}
              fullWidth
            >
              필터 초기화
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* 로딩 및 오류 표시 */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* 탭 */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="매칭 분석 탭">
          <Tab label="매칭 성과" />
          <Tab label="재매칭 분석" />
          <Tab label="매칭 내역 조회" />
          <Tab label="매칭 실패 내역" />
        </Tabs>
      </Box>

      {/* 매칭 성과 탭 */}
      <TabPanel value={tabValue} index={0}>
        {!loading && matchingStats && (
          <>
            <Typography variant="h6" gutterBottom>
              매칭 성사율
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <StatCard title="전체 매칭 성사율" value={matchingStats.totalMatchRate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard title="남성 매칭 성사율" value={matchingStats.maleMatchRate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard title="여성 매칭 성사율" value={matchingStats.femaleMatchRate} />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    매칭 성사율 비교
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={matchRateChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, '매칭 성사율']} />
                        <Legend />
                        <Bar dataKey="value" name="매칭 성사율" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    매칭 성사율 분포
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={matchRateChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {matchRateChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value}%`, '매칭 성사율']} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>

      {/* 재매칭 분석 탭 */}
      <TabPanel value={tabValue} index={1}>
        {!loading && matchingStats && (
          <>
            <Typography variant="h6" gutterBottom>
              재매칭 신청률
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <StatCard title="전체 재매칭 신청률" value={matchingStats.totalRematchRate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard title="남성 재매칭 신청률" value={matchingStats.maleRematchRate} />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard title="여성 재매칭 신청률" value={matchingStats.femaleRematchRate} />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              2차 재매칭 신청률
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <StatCard title="남성 2차 재매칭 신청률" value={matchingStats.maleSecondRematchRate} />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatCard title="여성 2차 재매칭 신청률" value={matchingStats.femaleSecondRematchRate} />
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom>
              3차 재매칭 신청률
            </Typography>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <StatCard title="남성 3차 재매칭 신청률" value={matchingStats.maleThirdRematchRate} />
              </Grid>
              <Grid item xs={12} md={6}>
                <StatCard title="여성 3차 재매칭 신청률" value={matchingStats.femaleThirdRematchRate} />
              </Grid>
            </Grid>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    재매칭 신청률 비교
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={rematchRateChartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip formatter={(value) => [`${value}%`, '재매칭 신청률']} />
                        <Legend />
                        <Bar dataKey="value" name="재매칭 신청률" fill="#82ca9d" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    2차/3차 재매칭 신청률 비교
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: '남성 2차', value: matchingStats.maleSecondRematchRate },
                          { name: '여성 2차', value: matchingStats.femaleSecondRematchRate },
                          { name: '남성 3차', value: matchingStats.maleThirdRematchRate },
                          { name: '여성 3차', value: matchingStats.femaleThirdRematchRate }
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis domain={[0, 50]} />
                        <Tooltip formatter={(value) => [`${value}%`, '재매칭 신청률']} />
                        <Legend />
                        <Bar dataKey="value" name="재매칭 신청률" fill="#ff8042" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </TabPanel>

      {/* 매칭 내역 조회 탭 */}
      <TabPanel value={tabValue} index={2}>
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              매칭 내역 검색
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={3}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                  <DatePicker
                    label="날짜 선택"
                    value={selectedDate}
                    onChange={(newDate) => {
                      setSelectedDate(newDate);
                      setIsSearchMode(false); // 날짜 변경 시 검색 모드 해제
                    }}
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
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="이름 검색"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="사용자 이름으로 검색"
                  helperText="이름의 일부만 입력해도 검색됩니다"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>매칭 타입</InputLabel>
                  <Select
                    value={matchType}
                    label="매칭 타입"
                    onChange={(e) => setMatchType(e.target.value)}
                  >
                    <MenuItem value="all">전체</MenuItem>
                    <MenuItem value="scheduled">무료 매칭</MenuItem>
                    <MenuItem value="admin">관리자 매칭</MenuItem>
                    <MenuItem value="rematching">유료 매칭</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>페이지당 항목 수</InputLabel>
                  <Select
                    value={historyLimit}
                    label="페이지당 항목 수"
                    onChange={(e) => setHistoryLimit(Number(e.target.value))}
                  >
                    <MenuItem value={5}>5개</MenuItem>
                    <MenuItem value={10}>10개</MenuItem>
                    <MenuItem value={20}>20개</MenuItem>
                    <MenuItem value={50}>50개</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  fullWidth
                  startIcon={<span role="img" aria-label="search">🔍</span>}
                >
                  검색하기
                </Button>
              </Grid>
              {isSearchMode && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={`검색 조건: ${searchName ? `이름 '${searchName}'` : ''} ${matchType !== 'all' ?
                        `매칭 타입 '${matchType === 'scheduled' ? '무료 매칭' :
                          matchType === 'admin' ? '관리자 매칭' : '유료 매칭'}'` : ''}`}
                      color="primary"
                      variant="outlined"
                      onDelete={() => {
                        setSearchName('');
                        setMatchType('all');
                        setIsSearchMode(false);
                      }}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      검색 모드 활성화됨
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>

        {/* 로딩 표시 */}
        {historyLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 매칭 내역 테이블 */}
        {!historyLoading && matchHistory && (
          <>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>매칭 ID</TableCell>
                    <TableCell>매칭 점수</TableCell>
                    <TableCell>매칭 타입</TableCell>
                    <TableCell>매칭 발표 시간</TableCell>
                    <TableCell>사용자 정보</TableCell>
                    <TableCell>매칭 상대 정보</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matchHistory.items.length > 0 ? (
                    matchHistory.items.map((item) => (
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
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {item.user && item.user.profileImageUrl ? (
                              <Avatar src={item.user.profileImageUrl} sx={{ mr: 1, width: 32, height: 32 }} />
                            ) : (
                              <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                                {item.user && item.user.name ? item.user.name.charAt(0) : '?'}
                              </Avatar>
                            )}
                            <Box>
                              {item.user ? (
                                <>
                                  <Typography variant="body2">{item.user.name} ({item.user.age}세)</Typography>
                                  {item.user.universityDetails && (
                                    <Typography variant="caption" color="text.secondary">
                                      {item.user.universityDetails.name} {item.user.universityDetails.department}
                                    </Typography>
                                  )}
                                </>
                              ) : (
                                <Typography variant="body2" color="text.secondary">사용자 정보 없음</Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {item.matcher ? (
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              {item.matcher.profileImageUrl ? (
                                <Avatar src={item.matcher.profileImageUrl} sx={{ mr: 1, width: 32, height: 32 }} />
                              ) : (
                                <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
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
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          해당 날짜에 매칭 내역이 없습니다.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 페이지네이션 */}
            {matchHistory.items.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <TablePagination
                  component="div"
                  count={matchHistory.meta.totalItems}
                  page={matchHistory.meta.currentPage - 1}
                  onPageChange={(_, newPage) => {
                    setHistoryPage(newPage + 1);

                    // 검색 모드인 경우 검색 파라미터를 유지하면서 페이지 변경
                    if (isSearchMode && selectedDate) {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      AdminService.matching.getMatchHistory(
                        formattedDate,
                        newPage + 1,
                        historyLimit,
                        searchName,
                        matchType
                      )
                        .then(data => setMatchHistory(data))
                        .catch(err => setError(err.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.'));
                    }
                  }}
                  rowsPerPage={matchHistory.meta.itemsPerPage}
                  onRowsPerPageChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setHistoryLimit(newLimit);
                    setHistoryPage(1);

                    // 검색 모드인 경우 검색 파라미터를 유지하면서 페이지당 항목 수 변경
                    if (isSearchMode && selectedDate) {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      AdminService.matching.getMatchHistory(
                        formattedDate,
                        1,
                        newLimit,
                        searchName,
                        matchType
                      )
                        .then(data => setMatchHistory(data))
                        .catch(err => setError(err.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.'));
                    }
                  }}
                  labelRowsPerPage="페이지당 항목 수"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
              </Box>
            )}
          </>
        )}

        {/* 데이터가 없는 경우 */}
        {!historyLoading && !matchHistory && !error && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              매칭 내역 조회
            </Typography>
            <Typography variant="body1" color="text.secondary">
              날짜를 선택하고 조회 버튼을 클릭하여 매칭 내역을 확인하세요.
            </Typography>
          </Paper>
        )}
      </TabPanel>

      {/* 매칭 실패 내역 탭 */}
      <TabPanel value={tabValue} index={3}>
        <Box sx={{ mb: 3 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              매칭 실패 내역 검색
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                  <DatePicker
                    label="날짜 선택"
                    value={selectedDate}
                    onChange={(newDate) => {
                      setSelectedDate(newDate);
                      setIsFailureSearchMode(false); // 날짜 변경 시 검색 모드 해제
                    }}
                    format="yyyy-MM-dd"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        size: 'small',
                        helperText: '매칭 실패 내역을 조회할 날짜를 선택하세요'
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="이름 검색"
                  value={failureSearchName}
                  onChange={(e) => setFailureSearchName(e.target.value)}
                  fullWidth
                  size="small"
                  placeholder="사용자 이름으로 검색"
                  helperText="이름의 일부만 입력해도 검색됩니다"
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>페이지당 항목 수</InputLabel>
                  <Select
                    value={failureLogsLimit}
                    label="페이지당 항목 수"
                    onChange={(e) => setFailureLogsLimit(Number(e.target.value))}
                  >
                    <MenuItem value={5}>5개</MenuItem>
                    <MenuItem value={10}>10개</MenuItem>
                    <MenuItem value={20}>20개</MenuItem>
                    <MenuItem value={50}>50개</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleFailureSearch}
                  fullWidth
                  startIcon={<span role="img" aria-label="search">🔍</span>}
                >
                  검색하기
                </Button>
              </Grid>
              {isFailureSearchMode && (
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Chip
                      label={`검색 조건: 이름 '${failureSearchName}'`}
                      color="primary"
                      variant="outlined"
                      onDelete={() => {
                        setFailureSearchName('');
                        setIsFailureSearchMode(false);
                      }}
                      sx={{ mr: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      검색 모드 활성화됨
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Box>

        {/* 로딩 표시 */}
        {failureLogsLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* 매칭 실패 내역 테이블 */}
        {!failureLogsLoading && failureLogs && (
          <>
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell>실패 ID</TableCell>
                    <TableCell>사용자 정보</TableCell>
                    <TableCell>실패 사유</TableCell>
                    <TableCell>발생 시간</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {failureLogs.items.length > 0 ? (
                    failureLogs.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.id}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar sx={{ mr: 1, width: 32, height: 32 }}>
                              {item.userName ? item.userName.charAt(0) : '?'}
                            </Avatar>
                            <Box>
                              <Typography variant="body2">{item.userName || '이름 없음'}</Typography>
                              <Typography variant="caption" color="text.secondary">
                                ID: {item.userId}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{item.reason}</Typography>
                        </TableCell>
                        <TableCell>
                          {new Date(item.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography variant="body1" sx={{ py: 2 }}>
                          해당 날짜에 매칭 실패 내역이 없습니다.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* 페이지네이션 */}
            {failureLogs.items.length > 0 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <TablePagination
                  component="div"
                  count={failureLogs.meta.totalItems}
                  page={failureLogs.meta.currentPage - 1}
                  onPageChange={(_, newPage) => {
                    setFailureLogsPage(newPage + 1);

                    // 검색 모드인 경우 검색 파라미터를 유지하면서 페이지 변경
                    if (isFailureSearchMode && selectedDate) {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      AdminService.matching.getFailureLogs(
                        formattedDate,
                        newPage + 1,
                        failureLogsLimit,
                        failureSearchName
                      )
                        .then(data => setFailureLogs(data))
                        .catch(err => setError(err.message || '매칭 실패 내역을 불러오는 중 오류가 발생했습니다.'));
                    }
                  }}
                  rowsPerPage={failureLogs.meta.itemsPerPage}
                  onRowsPerPageChange={(e) => {
                    const newLimit = parseInt(e.target.value, 10);
                    setFailureLogsLimit(newLimit);
                    setFailureLogsPage(1);

                    // 검색 모드인 경우 검색 파라미터를 유지하면서 페이지당 항목 수 변경
                    if (isFailureSearchMode && selectedDate) {
                      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
                      AdminService.matching.getFailureLogs(
                        formattedDate,
                        1,
                        newLimit,
                        failureSearchName
                      )
                        .then(data => setFailureLogs(data))
                        .catch(err => setError(err.message || '매칭 실패 내역을 불러오는 중 오류가 발생했습니다.'));
                    }
                  }}
                  labelRowsPerPage="페이지당 항목 수"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} / ${count}`}
                />
              </Box>
            )}
          </>
        )}

        {/* 데이터가 없는 경우 */}
        {!failureLogsLoading && !failureLogs && !error && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              매칭 실패 내역 조회
            </Typography>
            <Typography variant="body1" color="text.secondary">
              날짜를 선택하고 조회 버튼을 클릭하여 매칭 실패 내역을 확인하세요.
            </Typography>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
}