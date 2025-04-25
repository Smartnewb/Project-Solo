'use client';

import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  TextField,
  Button
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import VisibilityIcon from '@mui/icons-material/Visibility';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DevicesIcon from '@mui/icons-material/Devices';
import { AnalyticsService } from '@/app/services';
import { format, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

// 분석 컴포넌트 가져오기
import {
  VisitorAnalytics,
  PageAnalytics,
  TrafficSourceAnalytics,
  DeviceAnalytics,
  DemographicsAnalytics
} from '@/app/components/admin/analytics';

// 대시보드 데이터 타입 정의
interface DashboardData {
  overview: {
    activeUsers: number;
    sessions: number;
    pageViews: number;
    bounceRate: number;
    averageSessionDuration: number;
  };
  dailyUsers: Array<{
    date: string;
    users: number;
  }>;
  topPages: Array<{
    path: string;
    pageViews: number;
  }>;
  trafficSources: Array<{
    source: string;
    sessions: number;
  }>;
  deviceCategories: Array<{
    category: string;
    users: number;
  }>;
  period: {
    startDate: string;
    endDate: string;
  };
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [demographicsData, setDemographicsData] = useState<any>(null);
  const [dailyTrafficData, setDailyTrafficData] = useState<any>(null);
  const [deviceDetailData, setDeviceDetailData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());

  // 대시보드 데이터 가져오기
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);

      const params = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      };

      const data = await AnalyticsService.analytics.getDashboardData(params);
      console.log('대시보드 데이터 응답:', data);

      // 응답 형식 확인
      if (data && typeof data === 'object' && 'overview' in data) {
        setDashboardData(data);
      } else {
        console.error('대시보드 데이터 형식이 예상과 다릅니다:', data);
        setDashboardData(null);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('대시보드 데이터 가져오기 오류:', error);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 인구통계 데이터 가져오기
  const fetchDemographicsData = async () => {
    try {
      const params = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      };

      const data = await AnalyticsService.analytics.getUserDemographics(params);
      console.log('인구통계 데이터 응답:', data);

      setDemographicsData(data);
    } catch (error) {
      console.error('인구통계 데이터 가져오기 오류:', error);
      setDemographicsData(null);
    }
  };

  // 일별 트래픽 데이터 가져오기
  const fetchDailyTrafficData = async () => {
    try {
      const params = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      };

      const data = await AnalyticsService.analytics.getDailyTraffic(params);
      console.log('일별 트래픽 데이터 응답:', data);

      setDailyTrafficData(data);
    } catch (error) {
      console.error('일별 트래픽 데이터 가져오기 오류:', error);
      setDailyTrafficData(null);
    }
  };

  // 디바이스 상세 정보 가져오기
  const fetchDeviceDetailData = async () => {
    try {
      const params = {
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined
      };

      const data = await AnalyticsService.analytics.getDevices(params);
      console.log('디바이스 상세 정보 응답:', data);

      setDeviceDetailData(data);
    } catch (error) {
      console.error('디바이스 상세 정보 가져오기 오류:', error);
      setDeviceDetailData(null);
    }
  };

  // 탭 변경 핸들러
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);

    // 방문자 분석 탭으로 변경 시 일별 트래픽 데이터 로드
    if (newValue === 0 && !dailyTrafficData) {
      fetchDailyTrafficData();
    }

    // 디바이스 탭으로 변경 시 상세 정보 로드
    if (newValue === 3 && !deviceDetailData) {
      fetchDeviceDetailData();
    }

    // 인구통계 탭으로 변경 시 데이터 로드
    if (newValue === 4 && !demographicsData) {
      fetchDemographicsData();
    }
  };

  // 날짜 변경 후 데이터 새로고침
  const handleDateChange = () => {
    fetchDashboardData();

    // 현재 방문자 분석 탭이 활성화되어 있으면 일별 트래픽 데이터도 새로고침
    if (activeTab === 0) {
      fetchDailyTrafficData();
    }

    // 현재 디바이스 탭이 활성화되어 있으면 디바이스 상세 정보도 새로고침
    if (activeTab === 3) {
      fetchDeviceDetailData();
    }

    // 현재 인구통계 탭이 활성화되어 있으면 인구통계 데이터도 새로고침
    if (activeTab === 4) {
      fetchDemographicsData();
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <CircularProgress size={60} />
        <Typography variant="h6" className="mt-4">
          분석 데이터 로딩 중...
        </Typography>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Typography variant="h6" className="text-red-500">
          데이터를 불러오는 데 실패했습니다.
        </Typography>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Typography variant="h4" component="h1" gutterBottom>
          트래픽 분석
        </Typography>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <Typography variant="body2" color="textSecondary">
              마지막 업데이트: {lastUpdated.toLocaleString('ko-KR')}
            </Typography>
          )}
          <Tooltip title="새로고침">
            <IconButton onClick={fetchDashboardData} color="primary">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </div>
      </div>

      {/* 날짜 선택 */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <div className="flex flex-wrap gap-4 items-center">
            <DatePicker
              label="시작일"
              value={startDate}
              onChange={(newValue) => setStartDate(newValue)}
              format="yyyy-MM-dd"
            />
            <DatePicker
              label="종료일"
              value={endDate}
              onChange={(newValue) => setEndDate(newValue)}
              format="yyyy-MM-dd"
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleDateChange}
              className="ml-2"
            >
              적용
            </Button>
          </div>
        </LocalizationProvider>
      </div>

      {/* 요약 카드 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <PersonIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                활성 사용자
              </Typography>
              <Typography variant="h4">{dashboardData?.overview?.activeUsers ? dashboardData.overview.activeUsers.toLocaleString() : '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <VisibilityIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                페이지뷰
              </Typography>
              <Typography variant="h4">{dashboardData?.overview?.pageViews ? dashboardData.overview.pageViews.toLocaleString() : '0'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <TrendingUpIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                이탈률
              </Typography>
              <Typography variant="h4">
                {dashboardData?.overview?.bounceRate
                  ? (dashboardData.overview.bounceRate * 100).toFixed(1)
                  : '0.0'}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent className="flex flex-col items-center">
              <DevicesIcon fontSize="large" color="primary" />
              <Typography color="textSecondary" gutterBottom>
                평균 세션 시간
              </Typography>
              <Typography variant="h4">
                {dashboardData?.overview?.averageSessionDuration
                  ? `${Math.floor(dashboardData.overview.averageSessionDuration / 60)}분 ${Math.floor(dashboardData.overview.averageSessionDuration % 60)}초`
                  : '0분 0초'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="분석 탭">
          <Tab label="방문자 분석" />
          <Tab label="페이지 분석" />
          <Tab label="트래픽 소스" />
          <Tab label="디바이스" />
          <Tab label="인구통계" />
        </Tabs>
      </Box>

      {/* 탭 컨텐츠 */}
      <div className="mt-4">
        {activeTab === 0 && (
          <div className="p-4 bg-white rounded-lg shadow">
            {dashboardData ? (
              <VisitorAnalytics
                startDate={startDate}
                endDate={endDate}
                dailyUsers={dashboardData.dailyUsers}
                overview={dashboardData.overview}
                userEngagement={null} // 실제 API 호출 시 사용자 참여도 데이터 전달
                dailyTraffic={dailyTrafficData}
              />
            ) : (
              <Typography variant="h6" color="error" className="text-center p-4">
                방문자 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
              </Typography>
            )}
          </div>
        )}
        {activeTab === 1 && (
          <div className="p-4 bg-white rounded-lg shadow">
            {dashboardData ? (
              <PageAnalytics
                startDate={startDate}
                endDate={endDate}
                topPages={dashboardData.topPages}
                overview={dashboardData.overview}
                topPagesDetailed={null} // 실제 API 호출 시 인기 페이지 상세 데이터 전달
              />
            ) : (
              <Typography variant="h6" color="error" className="text-center p-4">
                페이지 분석 데이터를 불러올 수 없습니다. 다시 시도해주세요.
              </Typography>
            )}
          </div>
        )}
        {activeTab === 2 && (
          <div className="p-4 bg-white rounded-lg shadow">
            {dashboardData ? (
              <TrafficSourceAnalytics
                startDate={startDate}
                endDate={endDate}
                trafficSources={dashboardData.trafficSources}
                period={dashboardData.period}
              />
            ) : (
              <Typography variant="h6" color="error" className="text-center p-4">
                트래픽 소스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
              </Typography>
            )}
          </div>
        )}
        {activeTab === 3 && (
          <div className="p-4 bg-white rounded-lg shadow">
            {dashboardData ? (
              <DeviceAnalytics
                startDate={startDate}
                endDate={endDate}
                deviceCategories={dashboardData.deviceCategories}
                period={dashboardData.period}
                deviceDetail={deviceDetailData}
              />
            ) : (
              <Typography variant="h6" color="error" className="text-center p-4">
                디바이스 데이터를 불러올 수 없습니다. 다시 시도해주세요.
              </Typography>
            )}
          </div>
        )}
        {activeTab === 4 && (
          <div className="p-4 bg-white rounded-lg shadow">
            {dashboardData ? (
              <DemographicsAnalytics
                startDate={startDate}
                endDate={endDate}
                demographics={demographicsData}
              />
            ) : (
              <Typography variant="h6" color="error" className="text-center p-4">
                인구통계 데이터를 불러올 수 없습니다. 다시 시도해주세요.
              </Typography>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
