'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import AdminService from '@/app/services/admin';
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
  Divider,
  Paper
} from '@mui/material';
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

interface MatchUser {
  id: string;
  name: string;
  gender: string;
  age: number;
}

interface MatchHistoryItem {
  matchId: string;
  score: string;
  publishedAt: string;
  createdAt: string;
  type: string;
  user1: MatchUser;
  user2: MatchUser;
}

interface MatchHistoryMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface MatchHistoryResponse {
  items: MatchHistoryItem[];
  total?: number;
  totalItems?: number;
  page?: number;
  limit?: number;
  itemsPerPage?: number;
  totalPages?: number;
  meta?: MatchHistoryMeta; // 백엔드에서 반환하는 메타데이터
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
  const { user, loading: authLoading, isAuthenticated } = useAdminAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedUniversity, setSelectedUniversity] = useState<string>('');
  const [matchingStats, setMatchingStats] = useState<MatchingStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [universities, setUniversities] = useState<string[]>([]);
  const [tabValue, setTabValue] = useState(0);

  // 매칭 내역 관련 상태
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [matchHistory, setMatchHistory] = useState<MatchHistoryResponse | null>(null);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [historyLimit, setHistoryLimit] = useState<number>(10);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [searchName, setSearchName] = useState<string>('');
  const [appliedSearchName, setAppliedSearchName] = useState<string>('');

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
      if (tabValue !== 2) return; // 매칭 내역 탭이 아니면 실행하지 않음

      try {
        setHistoryLoading(true);
        setError(null);

        const data = await AdminService.matching.getMatchHistory(
          selectedDate,
          historyPage,
          historyLimit,
          appliedSearchName
        );

        setMatchHistory(data);
      } catch (err: any) {
        console.error('매칭 내역 조회 중 오류:', err);
        setError(err.message || '매칭 내역을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchMatchHistory();
  }, [tabValue, selectedDate, historyPage, historyLimit, appliedSearchName]);

  // 검색 실행 함수
  const handleSearch = () => {
    setHistoryPage(1); // 검색 시 첫 페이지로 이동
    setAppliedSearchName(searchName);
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

  if (!user || !isAuthenticated) {
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
          <Tab label="매칭 내역" />
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

      {/* 매칭 내역 탭 */}
      <TabPanel value={tabValue} index={2}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>매칭 내역 검색</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>날짜 선택</Typography>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                style={{
                  padding: '10px 14px',
                  border: '1px solid rgba(0, 0, 0, 0.23)',
                  borderRadius: '4px',
                  width: '100%',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>사용자 이름 검색</Typography>
              <div style={{ display: 'flex' }}>
                <input
                  type="text"
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  placeholder="이름으로 검색"
                  style={{
                    padding: '10px 14px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px 0 0 4px',
                    width: '100%',
                    fontSize: '1rem',
                    boxSizing: 'border-box'
                  }}
                />
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSearch}
                  sx={{
                    height: '42px',
                    borderRadius: '0 4px 4px 0',
                    minWidth: '64px'
                  }}
                >
                  검색
                </Button>
              </div>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>표시 개수</Typography>
              <Select
                value={historyLimit}
                onChange={(e) => setHistoryLimit(Number(e.target.value))}
                fullWidth
                size="small"
                sx={{ height: '42px' }}
              >
                <MenuItem value={5}>5개</MenuItem>
                <MenuItem value={10}>10개</MenuItem>
                <MenuItem value={20}>20개</MenuItem>
                <MenuItem value={50}>50개</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>필터 초기화</Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={() => {
                  setHistoryPage(1);
                  setSelectedDate(new Date().toISOString().split('T')[0]);
                  setSearchName('');
                  setAppliedSearchName('');
                }}
                fullWidth
                sx={{ height: '42px' }}
              >
                초기화
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {historyLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : matchHistory && matchHistory.items.length > 0 ? (
          <>
            <Paper sx={{ width: '100%', overflow: 'hidden' }}>
              <Box sx={{ width: '100%', overflow: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>매칭 ID</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>매칭 점수</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>매칭 유형</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>매칭 시간</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>사용자 1</th>
                      <th style={{ padding: '16px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>사용자 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matchHistory.items.map((item) => (
                      <tr key={item.matchId} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '16px' }}>{item.matchId.substring(0, 8)}...</td>
                        <td style={{ padding: '16px' }}>{parseFloat(item.score) * 100}%</td>
                        <td style={{ padding: '16px' }}>
                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor:
                                item.type === 'scheduled' ? '#e3f2fd' :
                                item.type === 'admin' ? '#e8f5e9' :
                                item.type === 'rematching' ? '#fff8e1' : '#f3e5f5',
                              color:
                                item.type === 'scheduled' ? '#1976d2' :
                                item.type === 'admin' ? '#2e7d32' :
                                item.type === 'rematching' ? '#ff9800' : '#9c27b0'
                            }}
                          >
                            {item.type === 'scheduled' ? '무료매칭' :
                             item.type === 'admin' ? '관리자 수동매칭' :
                             item.type === 'rematching' ? '재매칭(과금)' :
                             item.type === 'matching' ? '일반 매칭' : item.type}
                          </span>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {new Date(item.publishedAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: item.user1.gender === 'MALE' ? '#1976d2' : '#e91e63',
                                marginRight: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px'
                              }}
                            >
                              {item.user1.gender === 'MALE' ? 'M' : 'F'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{item.user1.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{item.user1.age}세</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: item.user2.gender === 'MALE' ? '#1976d2' : '#e91e63',
                                marginRight: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'white',
                                fontSize: '12px'
                              }}
                            >
                              {item.user2.gender === 'MALE' ? 'M' : 'F'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 'bold' }}>{item.user2.name}</div>
                              <div style={{ fontSize: '12px', color: '#666' }}>{item.user2.age}세</div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>

              {/* 페이지네이션 */}
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Button
                  disabled={matchHistory.meta ? !matchHistory.meta.hasPreviousPage : historyPage <= 1}
                  onClick={() => {
                    const newPage = historyPage - 1;
                    setHistoryPage(newPage);
                  }}
                  sx={{ mx: 1 }}
                >
                  이전
                </Button>
                <Typography sx={{ mx: 2, display: 'flex', alignItems: 'center' }}>
                  {matchHistory.meta ? matchHistory.meta.currentPage : historyPage} /
                  {matchHistory.meta
                    ? Math.ceil(matchHistory.meta.totalItems / matchHistory.meta.itemsPerPage)
                    : (matchHistory.totalPages || Math.ceil((matchHistory.totalItems || matchHistory.total || 0) / (matchHistory.itemsPerPage || historyLimit)) || 1)}
                </Typography>
                <Button
                  disabled={matchHistory.meta ? !matchHistory.meta.hasNextPage : (historyPage >= (matchHistory.totalPages || Math.ceil((matchHistory.totalItems || matchHistory.total || 0) / (matchHistory.itemsPerPage || historyLimit)) || 1))}
                  onClick={() => {
                    const newPage = historyPage + 1;
                    setHistoryPage(newPage);
                  }}
                  sx={{ mx: 1 }}
                >
                  다음
                </Button>
              </Box>
            </Paper>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                {matchHistory.meta ? (
                  <>
                    총 {matchHistory.meta.totalItems}개의 매칭 내역 중 {(matchHistory.meta.currentPage - 1) * matchHistory.meta.itemsPerPage + 1}-
                    {Math.min(matchHistory.meta.currentPage * matchHistory.meta.itemsPerPage, matchHistory.meta.totalItems)}개를 표시하고 있습니다.
                  </>
                ) : (
                  <>
                    총 {matchHistory.totalItems || matchHistory.total || 0}개의 매칭 내역 중 {(historyPage - 1) * (matchHistory.itemsPerPage || historyLimit) + 1}-
                    {Math.min(historyPage * (matchHistory.itemsPerPage || historyLimit), matchHistory.totalItems || matchHistory.total || 0)}개를 표시하고 있습니다.
                  </>
                )}
                {appliedSearchName && (
                  <span> (검색어: "{appliedSearchName}")</span>
                )}
              </Typography>
            </Box>
          </>
        ) : (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">
              {appliedSearchName
                ? `"${appliedSearchName}" 검색 결과가 없습니다.`
                : '매칭 내역이 없습니다.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {appliedSearchName
                ? '다른 검색어를 입력하거나 필터를 초기화해 보세요.'
                : '다른 날짜를 선택하거나 필터를 초기화해 보세요.'}
            </Typography>
          </Paper>
        )}
      </TabPanel>
    </Box>
  );
}