'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Tabs, Tab, Alert, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import GenderRatioDashboard from '@/components/admin/dashboard/GenderRatioDashboard';
import CustomPeriodSignupStats from '@/components/admin/dashboard/CustomPeriodSignupStats';
import UserAcquisitionChart from '@/components/admin/dashboard/UserAcquisitionChart';
import UniversityPerformanceTable from '@/components/admin/dashboard/UniversityPerformanceTable';
import ProfileCompletionFunnel from '@/components/admin/dashboard/ProfileCompletionFunnel';
import TotalUsersCard from '@/components/admin/dashboard/TotalUsersCard';
import DailySignupsCard from '@/components/admin/dashboard/DailySignupsCard';
import WeeklySignupsCard from '@/components/admin/dashboard/WeeklySignupsCard';
import SignupTrendChart from '@/components/admin/dashboard/SignupTrendChart';
import GenderStatsCard from '@/components/admin/dashboard/GenderStatsCard';
import UniversityStatsCard from '@/components/admin/dashboard/UniversityStatsCard';

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
      id={`dashboard-tabpanel-${index}`}
      aria-labelledby={`dashboard-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `dashboard-tab-${index}`,
    'aria-controls': `dashboard-tabpanel-${index}`,
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authChecking, setAuthChecking] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 관리자 인증 확인
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthChecking(true);
        // 로컬 스토리지에서 토큰과 관리자 여부 확인
        const token = localStorage.getItem('accessToken');
        const isAdmin = localStorage.getItem('isAdmin');

        if (!token || isAdmin !== 'true') {
          setAuthError('관리자 권한이 없습니다. 로그인 페이지로 이동합니다.');
          setTimeout(() => {
            router.push('/');
          }, 2000);
          return;
        }

        setAuthError(null);
      } catch (error) {
        console.error('인증 확인 오류:', error);
        setAuthError('인증 확인 중 오류가 발생했습니다.');
      } finally {
        setAuthChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  // 통계 데이터 가져오기
  useEffect(() => {
    // 인증 중이거나 인증 오류가 있으면 통계 데이터를 가져오지 않음
    if (authChecking || authError) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60000); // 1분마다 갱신

    return () => clearInterval(interval);
  }, [authChecking, authError]);

  // 인증 확인 중이거나 인증 오류가 있으면 로딩 화면 또는 오류 메시지 표시
  if (authChecking) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ ml: 2 }}>
          관리자 권한 확인 중...
        </Typography>
      </Box>
    );
  }

  if (authError) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
        <Typography variant="body1">
          잠시 후 로그인 페이지로 이동합니다...
        </Typography>
      </Box>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          관리자 대시보드
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TotalUsersCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <WeeklySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <DailySignupsCard />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  총 매칭 수
                </Typography>
                <Typography variant="h4">
                  {loading ? '로딩 중...' : stats?.totalMatches.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* 성별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <GenderStatsCard />
        </Box>

        {/* 회원가입 추이 그래프 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <SignupTrendChart />
        </Box>

        {/* 사용자 지정 기간 회원가입 통계 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <CustomPeriodSignupStats />
        </Box>

        {/* 대학별 통계 카드 */}
        <Box sx={{ mt: 4, mb: 4 }}>
          <UniversityStatsCard />
        </Box>

        {/* 탭 메뉴 */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="dashboard tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="여성 사용자 유입" {...a11yProps(0)} />
            <Tab label="성비 균형" {...a11yProps(1)} />
            <Tab label="사용자 활동" {...a11yProps(2)} />
            <Tab label="대학별 성과" {...a11yProps(3)} />
          </Tabs>
        </Box>

        {/* 탭 패널 */}
        <TabPanel value={activeTab} index={0}>
          <UserAcquisitionChart />
        </TabPanel>
        <TabPanel value={activeTab} index={1}>
          <GenderRatioDashboard />
        </TabPanel>
        <TabPanel value={activeTab} index={2}>
          <ProfileCompletionFunnel />
        </TabPanel>
        <TabPanel value={activeTab} index={3}>
          <UniversityPerformanceTable />
        </TabPanel>
      </Box>
    </LocalizationProvider>
  );
}
