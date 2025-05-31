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
const formatData = (data: any[], type: 'daily' | 'weekly' | 'monthly') => {
  return data.map(item => {
    let formattedDate: string;

    switch (type) {
      case 'daily':
        const date = new Date(item.label);
        formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
        break;
      case 'weekly':
        // 주별 데이터는 "2025-05-18 ~ 2025-05-24" 형태로 오므로 시작일만 추출하여 포맷팅
        const weekRange = item.label.split(' ~ ');
        const startDate = new Date(weekRange[0]);
        const month = startDate.getMonth() + 1;
        const day = startDate.getDate();
        formattedDate = `${month}/${day}주`;
        break;
      case 'monthly':
        const monthDate = new Date(item.label);
        formattedDate = `${monthDate.getFullYear()}년 ${monthDate.getMonth() + 1}월`;
        break;
    }

    return {
      date: formattedDate,
      originalDate: item.label,
      '탈퇴자수': item.count
    };
  });
};

const formatDailyData = (data: any[]) => formatData(data, 'daily');
const formatWeeklyData = (data: any[]) => formatData(data, 'weekly');
const formatMonthlyData = (data: any[]) => formatData(data, 'monthly');

// 커스텀 툴팁 컴포넌트
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{
        backgroundColor: 'white',
        padding: '10px',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <p style={{ margin: 0, fontWeight: 'bold' }}>{`날짜: ${label}`}</p>
        {data.originalDate && (
          <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
            {`상세: ${data.originalDate}`}
          </p>
        )}
        <p style={{ margin: 0, color: '#ff7300' }}>
          {`탈퇴자수: ${payload[0].value}명`}
        </p>
      </div>
    );
  }
  return null;
};

// 재사용 가능한 차트 컴포넌트
const WithdrawalChart = ({ data, color, interval = 1 }: { data: any[], color: string, interval?: number }) => (
  <Box sx={{ height: 400 }}>
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 90 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="date"
          interval={interval}
          angle={-45}
          textAnchor="end"
          height={80}
          fontSize={12}
          tick={{ fontSize: 12 }}
        />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey="탈퇴자수" stroke={color} activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  </Box>
);

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
              <WithdrawalChart data={formatDailyData(dailyData)} color="#ff7300" interval={1} />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 30일간 일별 회원 탈퇴 추이
              </Typography>
            </TabPanel>

            {/* 주별 탭 */}
            <TabPanel value={activeTab} index={1}>
              <WithdrawalChart data={formatWeeklyData(weeklyData)} color="#ff4500" interval={0} />
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 12주간 주별 회원 탈퇴 추이
              </Typography>
            </TabPanel>

            {/* 월별 탭 */}
            <TabPanel value={activeTab} index={2}>
              <WithdrawalChart data={formatMonthlyData(monthlyData)} color="#d32f2f" interval={0} />
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
                    <WithdrawalChart
                      data={formatDailyData(customPeriodData)}
                      color="#8884d8"
                      interval={Math.max(1, Math.floor(customPeriodData.length / 10))}
                    />
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
