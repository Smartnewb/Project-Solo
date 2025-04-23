'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Grid,
  TextField,
  Button,
  Paper
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format, isAfter, isBefore, addDays, subDays, subMonths } from 'date-fns';
import AdminService from '@/app/services/admin';

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
      id={`withdrawal-trend-tabpanel-${index}`}
      aria-labelledby={`withdrawal-trend-tab-${index}`}
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
    id: `withdrawal-trend-tab-${index}`,
    'aria-controls': `withdrawal-trend-tabpanel-${index}`,
  };
}

// 빈 데이터 생성 함수들
const generateEmptyDailyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = subDays(today, i);
    data.push({
      date: format(date, 'yyyy-MM-dd'),
      count: 0
    });
  }

  return data;
};

const generateEmptyWeeklyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = subDays(today, i * 7);
    data.push({
      date: `${format(date, 'yyyy-MM-dd')}`,
      count: 0
    });
  }

  return data;
};

const generateEmptyMonthlyData = () => {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = subMonths(today, i);
    data.push({
      date: format(date, 'yyyy-MM'),
      count: 0
    });
  }

  return data;
};

// 데이터 포맷팅 함수들
const formatDailyData = (data: any[]) => {
  return data.map(item => ({
    date: item.date,
    '탈퇴자수': item.count
  }));
};

const formatWeeklyData = (data: any[]) => {
  return data.map(item => ({
    date: item.date,
    '탈퇴자수': item.count
  }));
};

const formatMonthlyData = (data: any[]) => {
  return data.map(item => ({
    date: item.date,
    '탈퇴자수': item.count
  }));
};

export default function WithdrawalStatsDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  // 사용자 지정 기간 상태
  const [startDate, setStartDate] = useState<Date | null>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [customPeriodData, setCustomPeriodData] = useState<any[]>([]);
  const [customPeriodLoading, setCustomPeriodLoading] = useState(false);
  const [customPeriodError, setCustomPeriodError] = useState<string | null>(null);

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 일별, 주별, 월별 데이터 조회
        // 기본적으로 비어있는 데이터 생성
        setDailyData(generateEmptyDailyData());
        setWeeklyData(generateEmptyWeeklyData());
        setMonthlyData(generateEmptyMonthlyData());

        // 일별 데이터 조회
        try {
          const dailyResponse = await AdminService.stats.getDailyWithdrawalTrend();
          console.log('일별 데이터 응답:', dailyResponse);
          if (dailyResponse?.data && Array.isArray(dailyResponse.data) && dailyResponse.data.length > 0) {
            setDailyData(dailyResponse.data);
          }
        } catch (err) {
          console.error('일별 데이터 조회 오류:', err);
        }

        // 주별 데이터 조회
        try {
          const weeklyResponse = await AdminService.stats.getWeeklyWithdrawalTrend();
          console.log('주별 데이터 응답:', weeklyResponse);
          if (weeklyResponse?.data && Array.isArray(weeklyResponse.data) && weeklyResponse.data.length > 0) {
            setWeeklyData(weeklyResponse.data);
          }
        } catch (err) {
          console.error('주별 데이터 조회 오류:', err);
        }

        // 월별 데이터 조회
        try {
          const monthlyResponse = await AdminService.stats.getMonthlyWithdrawalTrend();
          console.log('월별 데이터 응답:', monthlyResponse);
          if (monthlyResponse?.data && Array.isArray(monthlyResponse.data) && monthlyResponse.data.length > 0) {
            setMonthlyData(monthlyResponse.data);
          }
        } catch (err) {
          console.error('월별 데이터 조회 오류:', err);
        }

      } catch (err) {
        console.error('회원 탈퇴 추이 데이터 조회 중 오류:', err);
        // 오류가 발생해도 비어있는 데이터 생성
        setDailyData(generateEmptyDailyData());
        setWeeklyData(generateEmptyWeeklyData());
        setMonthlyData(generateEmptyMonthlyData());
        setError('데이터를 불러오는데 실패했습니다. 임시 데이터를 표시합니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 사용자 지정 기간 데이터 조회
  const fetchCustomPeriodData = async () => {
    if (!startDate || !endDate) {
      setCustomPeriodError('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    if (isAfter(startDate, endDate)) {
      setCustomPeriodError('시작일은 종료일보다 이전이어야 합니다.');
      return;
    }

    try {
      setCustomPeriodLoading(true);
      setCustomPeriodError(null);

      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');

      const response = await AdminService.stats.getCustomPeriodWithdrawalTrend(
        formattedStartDate,
        formattedEndDate
      );

      console.log('사용자 지정 기간 데이터 응답:', response);

      if (response && response.data && response.data.length > 0) {
        setCustomPeriodData(response.data);
      } else {
        setCustomPeriodData([]);
        setCustomPeriodError('선택한 기간에 데이터가 없습니다.');
      }
    } catch (err) {
      console.error('사용자 지정 기간 데이터 조회 오류:', err);
      setCustomPeriodData([]);
      setCustomPeriodError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setCustomPeriodLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          회원 탈퇴 추이
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="withdrawal trend tabs"
          variant="fullWidth"
        >
          <Tab label="일별" {...a11yProps(0)} />
          <Tab label="주별" {...a11yProps(1)} />
          <Tab label="월별" {...a11yProps(2)} />
          <Tab label="기간별" {...a11yProps(3)} />
        </Tabs>

        {loading && activeTab < 3 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && activeTab < 3 && <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}

            {/* 일별 탭 */}
            <TabPanel value={activeTab} index={0}>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatDailyData(dailyData)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" interval={2} angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="탈퇴자수"
                      stroke="#ff7300"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 30일간 일별 회원 탈퇴 추이
              </Typography>
            </TabPanel>

            {/* 주별 탭 */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatWeeklyData(weeklyData)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" interval={1} angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="탈퇴자수"
                      stroke="#ff4500"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 12주간 주별 회원 탈퇴 추이
              </Typography>
            </TabPanel>

            {/* 월별 탭 */}
            <TabPanel value={activeTab} index={2}>
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatMonthlyData(monthlyData)}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" interval={0} angle={-45} textAnchor="end" height={70} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="탈퇴자수"
                      stroke="#d32f2f"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 12개월간 월별 회원 탈퇴 추이
              </Typography>
            </TabPanel>

            {/* 기간별 탭 */}
            <TabPanel value={activeTab} index={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <Paper elevation={0} sx={{ p: 2, mb: 3 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={5}>
                      <DatePicker
                        label="시작일"
                        value={startDate}
                        onChange={(newValue) => setStartDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            error: !!customPeriodError && !startDate
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={5}>
                      <DatePicker
                        label="종료일"
                        value={endDate}
                        onChange={(newValue) => setEndDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined',
                            error: !!customPeriodError && !endDate
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={2}>
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={fetchCustomPeriodData}
                        disabled={customPeriodLoading || !startDate || !endDate}
                      >
                        {customPeriodLoading ? '로딩 중...' : '조회'}
                      </Button>
                    </Grid>
                  </Grid>
                  {customPeriodError && (
                    <Alert severity="error" sx={{ mt: 2 }}>
                      {customPeriodError}
                    </Alert>
                  )}
                </Paper>
              </LocalizationProvider>

              {customPeriodLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <>
                  {customPeriodData.length > 0 ? (
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={formatDailyData(customPeriodData)}
                          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            interval={Math.max(1, Math.floor(customPeriodData.length / 10))}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="탈퇴자수"
                            stroke="#8884d8"
                            activeDot={{ r: 8 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ py: 5, textAlign: 'center' }}>
                      <Typography variant="body1" color="textSecondary">
                        {customPeriodError || '조회할 기간을 선택하고 조회 버튼을 클릭하세요.'}
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </TabPanel>
          </>
        )}
      </CardContent>
    </Card>
  );
}
