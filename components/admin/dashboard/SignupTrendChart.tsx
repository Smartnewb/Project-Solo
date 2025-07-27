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
  FormControlLabel,
  Switch
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
      id={`trend-tabpanel-${index}`}
      aria-labelledby={`trend-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 2 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `trend-tab-${index}`,
    'aria-controls': `trend-tabpanel-${index}`,
  };
}

// 일별 회원가입 추이 데이터 타입
interface DailySignupTrendItem {
  date: string;
  count: number;
}

interface DailySignupTrendResponse {
  data: DailySignupTrendItem[];
}

// 주별 회원가입 추이 데이터 타입
interface WeeklySignupTrendItem {
  weekStart: string;
  weekEnd: string;
  count: number;
}

interface WeeklySignupTrendResponse {
  data: WeeklySignupTrendItem[];
}

// 월별 회원가입 추이 데이터 타입
interface MonthlySignupTrendItem {
  month: string;
  count: number;
}

interface MonthlySignupTrendResponse {
  data: MonthlySignupTrendItem[];
}

interface SignupTrendChartProps {
  includeDeleted?: boolean;
}

export default function SignupTrendChart({ includeDeleted = false }: SignupTrendChartProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [dailyData, setDailyData] = useState<DailySignupTrendItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklySignupTrendItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySignupTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  // 비어있는 날짜 데이터 생성 (일별)
  const generateEmptyDailyData = () => {
    const data = [];
    const today = new Date();

    // 최근 30일간의 데이터 생성
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);

      // 날짜 형식을 YYYY-MM-DD로 저장 (포맷팅은 별도로 함)
      const dateStr = date.toISOString().split('T')[0];

      data.push({
        date: dateStr,
        count: 0
      });
    }

    return data;
  };

  // 비어있는 주별 데이터 생성
  const generateEmptyWeeklyData = () => {
    const data = [];
    const today = new Date();

    // 최근 12주간의 데이터 생성
    for (let i = 11; i >= 0; i--) {
      const endDate = new Date();
      endDate.setDate(today.getDate() - (i * 7));

      const startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);

      data.push({
        weekStart: startDate.toISOString().split('T')[0],
        weekEnd: endDate.toISOString().split('T')[0],
        count: 0
      });
    }

    return data;
  };

  // 비어있는 월별 데이터 생성
  const generateEmptyMonthlyData = () => {
    const data = [];
    const today = new Date();

    // 최근 12개월간의 데이터 생성
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      data.push({
        month: month,
        count: 0
      });
    }

    return data;
  };

  // 일별 데이터 포맷팅
  const formatDailyData = (data: DailySignupTrendItem[]) => {
    // 데이터가 없는 경우 비어있는 데이터 생성
    if (!data || data.length === 0) {
      data = generateEmptyDailyData();
    }

    return data.map(item => {
      // 백엔드에서 label을 제공하는 경우 해당 label 사용
      if ((item as any).label) {
        return {
          date: (item as any).label,
          가입자수: item.count
        };
      }

      let formattedDate = item.date;
      try {
        // 날짜 형식 확인 및 변환
        const date = new Date(item.date);
        if (!isNaN(date.getTime())) {
          // 월/일 형식으로 날짜 표시
          const month = date.getMonth() + 1; // getMonth()는 0부터 시작하므로 1 더함
          const day = date.getDate();
          formattedDate = `${month}/${day}`;
        }
      } catch (e) {
        console.error('일별 데이터 날짜 변환 오류:', e);
      }
      return {
        date: formattedDate,
        가입자수: item.count
      };
    });
  };

  // 주별 데이터 포맷팅
  const formatWeeklyData = (data: WeeklySignupTrendItem[]) => {
    // 데이터가 없는 경우 비어있는 데이터 생성
    if (!data || data.length === 0) {
      data = generateEmptyWeeklyData();
    }

    return data.map(item => {
      // 백엔드에서 label을 제공하는 경우 해당 label 사용
      if ((item as any).label) {
        return {
          date: (item as any).label,
          가입자수: item.count
        };
      }

      let formattedDate = `${item.weekStart} ~ ${item.weekEnd}`;
      try {
        // 날짜 형식 확인 및 변환
        const startDate = new Date(item.weekStart);
        const endDate = new Date(item.weekEnd);
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          // 월/일 형식으로 날짜 표시
          const startMonth = startDate.getMonth() + 1;
          const startDay = startDate.getDate();
          const endMonth = endDate.getMonth() + 1;
          const endDay = endDate.getDate();
          formattedDate = `${startMonth}/${startDay}~${endMonth}/${endDay}`;
        }
      } catch (e) {
        console.error('주별 데이터 날짜 변환 오류:', e);
      }
      return {
        date: formattedDate,
        가입자수: item.count
      };
    });
  };

  // 월별 데이터 포맷팅
  const formatMonthlyData = (data: MonthlySignupTrendItem[]) => {
    // 데이터가 없는 경우 비어있는 데이터 생성
    if (!data || data.length === 0) {
      data = generateEmptyMonthlyData();
    }

    return data.map(item => {
      // 백엔드에서 label을 제공하는 경우 해당 label 사용
      if ((item as any).label) {
        return {
          date: (item as any).label,
          가입자수: item.count
        };
      }

      let formattedDate = item.month;
      try {
        // 날짜 형식 확인 및 변환
        // month가 'YYYY-MM' 형식인지 확인
        if (/^\d{4}-\d{2}$/.test(item.month)) {
          const date = new Date(`${item.month}-01T00:00:00`);
          if (!isNaN(date.getTime())) {
            // 년도/월 형식으로 표시
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            formattedDate = `${year}/${month}`;
          }
        }
      } catch (e) {
        console.error('월별 데이터 날짜 변환 오류:', e);
      }
      return {
        date: formattedDate,
        가입자수: item.count
      };
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 일별 데이터 조회
        try {
          const dailyResponse = await AdminService.stats.getDailySignupTrend(undefined, includeDeleted);
          console.log('일별 데이터 응답:', dailyResponse);
          if (dailyResponse && dailyResponse.data && dailyResponse.data.length > 0) {
            setDailyData(dailyResponse.data);
          } else {
            // 데이터가 없는 경우 비어있는 데이터 생성
            setDailyData(generateEmptyDailyData());
          }
        } catch (err) {
          console.error('일별 데이터 조회 오류:', err);
          setDailyData(generateEmptyDailyData());
        }

        // 주별 데이터 조회
        try {
          const weeklyResponse = await AdminService.stats.getWeeklySignupTrend(undefined, includeDeleted);
          console.log('주별 데이터 응답:', weeklyResponse);
          if (weeklyResponse && weeklyResponse.data && weeklyResponse.data.length > 0) {
            setWeeklyData(weeklyResponse.data);
          } else {
            // 데이터가 없는 경우 비어있는 데이터 생성
            setWeeklyData(generateEmptyWeeklyData());
          }
        } catch (err) {
          console.error('주별 데이터 조회 오류:', err);
          setWeeklyData(generateEmptyWeeklyData());
        }

        // 월별 데이터 조회
        try {
          const monthlyResponse = await AdminService.stats.getMonthlySignupTrend(undefined, includeDeleted);
          console.log('월별 데이터 응답:', monthlyResponse);
          if (monthlyResponse && monthlyResponse.data && monthlyResponse.data.length > 0) {
            setMonthlyData(monthlyResponse.data);
          } else {
            // 데이터가 없는 경우 비어있는 데이터 생성
            setMonthlyData(generateEmptyMonthlyData());
          }
        } catch (err) {
          console.error('월별 데이터 조회 오류:', err);
          setMonthlyData(generateEmptyMonthlyData());
        }

      } catch (err) {
        console.error('회원가입 추이 데이터 조회 중 오류:', err);
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
    // 5분마다 데이터 갱신
    const interval = setInterval(fetchData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [includeDeleted]);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          회원가입 추이
        </Typography>

        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="signup trend tabs"
          variant="fullWidth"
        >
          <Tab label="일별" {...a11yProps(0)} />
          <Tab label="주별" {...a11yProps(1)} />
          <Tab label="월별" {...a11yProps(2)} />
        </Tabs>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {error && <Alert severity="warning" sx={{ mt: 2, mb: 2 }}>{error}</Alert>}
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
                      dataKey="가입자수"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 30일간 일별 회원가입 추이
              </Typography>
            </TabPanel>

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
                      dataKey="가입자수"
                      stroke="#82ca9d"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 12주간 주별 회원가입 추이
              </Typography>
            </TabPanel>

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
                      dataKey="가입자수"
                      stroke="#ff7300"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
                최근 12개월간 월별 회원가입 추이
              </Typography>
            </TabPanel>
          </>
        )}
      </CardContent>
    </Card>
  );
}
