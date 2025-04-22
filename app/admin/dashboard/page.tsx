'use client';

import { useState, useEffect } from 'react';
import { Grid, Card, CardContent, Typography, Box, Tabs, Tab } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import GenderRatioDashboard from '@/components/admin/dashboard/GenderRatioDashboard';
import UserAcquisitionChart from '@/components/admin/dashboard/UserAcquisitionChart';
import UniversityPerformanceTable from '@/components/admin/dashboard/UniversityPerformanceTable';
import ProfileCompletionFunnel from '@/components/admin/dashboard/ProfileCompletionFunnel';
import TotalUsersCard from '@/components/admin/dashboard/TotalUsersCard';
import DailySignupsCard from '@/components/admin/dashboard/DailySignupsCard';
import WeeklySignupsCard from '@/components/admin/dashboard/WeeklySignupsCard';

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
  const [activeTab, setActiveTab] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
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
  }, []);

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
