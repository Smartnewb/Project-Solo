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
    </Box>
  );
}