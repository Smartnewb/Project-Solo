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
import { format, isAfter, isBefore, addDays } from 'date-fns';
import AdminService from '@/app/services/admin';
import { getRegionLabel } from '@/components/admin/common/RegionFilter';

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
  label?: string;
  count: number;
}

interface DailySignupTrendResponse {
  data: DailySignupTrendItem[];
}

// 주별 회원가입 추이 데이터 타입
interface WeeklySignupTrendItem {
  weekStart: string;
  weekEnd: string;
  label?: string;
  count: number;
}

interface WeeklySignupTrendResponse {
  data: WeeklySignupTrendItem[];
}

// 월별 회원가입 추이 데이터 타입
interface MonthlySignupTrendItem {
  month: string;
  label?: string;
  count: number;
}

interface MonthlySignupTrendResponse {
  data: MonthlySignupTrendItem[];
}

interface SignupStatsDashboardProps {
  region?: string;
}

export default function SignupStatsDashboard({ region }: SignupStatsDashboardProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [dailyData, setDailyData] = useState<DailySignupTrendItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklySignupTrendItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlySignupTrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 지역 라벨 생성
  const regionLabel = region ? getRegionLabel(region as any) : '전체 지역';

  // 사용자 지정 기간 상태
  const [startDate, setStartDate] = useState<Date | null>(addDays(new Date(), -30)); // 기본값: 30일 전
  const [endDate, setEndDate] = useState<Date | null>(new Date()); // 기본값: 오늘
  const [customLoading, setCustomLoading] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);
  const [signupCount, setSignupCount] = useState<number>(0);
  const [trendData, setTrendData] = useState<any[]>([]);

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
      // item.label이 있는 경우 그대로 사용, 없는 경우 item.date를 포맷팅
      let formattedDate = item.label || item.date;
      if (!item.label && item.date) {
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
      let formattedDate = item.label;
       if (!formattedDate) {
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
      let formattedDate = item.label;
       if (!formattedDate) {
         try {
           // 날짜 형식 확인 및 변환
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
      }
      return {
        date: formattedDate,
        가입자수: item.count
      };
    });
  };

  // 회원가입 추이 데이터 조회
  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 일별 데이터 조회
        try {
          const dailyResponse = await AdminService.stats.getDailySignupTrend(region);
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
          const weeklyResponse = await AdminService.stats.getWeeklySignupTrend(region);
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
          const monthlyResponse = await AdminService.stats.getMonthlySignupTrend(region);
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

    fetchTrendData();
    // 5분마다 데이터 갱신
    const interval = setInterval(fetchTrendData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [region]);

  // 날짜 유효성 검사
  const isDateRangeValid = () => {
    if (!startDate || !endDate) return false;
    if (isAfter(startDate, endDate)) return false;
    return true;
  };

  // 사용자 지정 기간 데이터 조회
  const fetchCustomPeriodData = async () => {
    if (!isDateRangeValid()) {
      setCustomError('유효한 날짜 범위를 선택해주세요.');
      return;
    }

    // 인증 상태 확인
    if (!checkAuthStatus()) return;

    setCustomLoading(true);
    setCustomError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate as Date, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate as Date, 'yyyy-MM-dd');

      // 회원가입자 수 조회
      const countResponse = await AdminService.stats.getCustomPeriodSignupCount(
        formattedStartDate,
        formattedEndDate,
        region
      );

      console.log('회원가입자 수 응답:', countResponse);

      // API 응답 구조에 따라 적절한 값 추출
      let count = 0;

      if (typeof countResponse === 'number') {
        count = countResponse;
      } else if (typeof countResponse === 'object' && countResponse !== null) {
        // totalSignups 필드 확인 (현재 응답 구조에 맞게 추가)
        if ('totalSignups' in countResponse) {
          count = countResponse.totalSignups;
        } else if ('count' in countResponse) {
          count = countResponse.count;
        } else if ('data' in countResponse && countResponse.data && typeof countResponse.data === 'object') {
          if ('totalSignups' in countResponse.data) {
            count = countResponse.data.totalSignups;
          } else if ('count' in countResponse.data) {
            count = countResponse.data.count;
          } else if (Array.isArray(countResponse.data) && countResponse.data.length > 0) {
            // 배열인 경우 개수 합산
            count = countResponse.data.reduce((sum, item) => sum + (item.count || 0), 0);
          }
        }
      }

      setSignupCount(count);

      // 회원가입 추이 조회
      const trendResponse = await AdminService.stats.getCustomPeriodSignupTrend(
        formattedStartDate,
        formattedEndDate,
        region
      );

      console.log('회원가입 추이 응답:', trendResponse);

      // 응답 구조에 따라 데이터 추출
      let trendDataArray = [];

      if (Array.isArray(trendResponse)) {
        trendDataArray = trendResponse;
      } else if (typeof trendResponse === 'object' && trendResponse !== null) {
        if ('data' in trendResponse && Array.isArray(trendResponse.data)) {
          trendDataArray = trendResponse.data;
        } else if (Array.isArray(trendResponse.items)) {
          trendDataArray = trendResponse.items;
        }
      }

      // 데이터 포맷팅 - 백엔드에서 제공하는 label 사용
      const formattedData = trendDataArray.map((item: any) => {
        try {
          // 백엔드에서 label을 제공하는 경우 해당 label 사용
          if (item.label) {
            return {
              date: item.label,
              가입자수: item.count || 0
            };
          }

          // label이 없는 경우 기존 로직 사용
          if (!item.date) return { date: '-', 가입자수: item.count || 0 };

          const date = new Date(item.date);
          if (isNaN(date.getTime())) {
            return { date: item.date, 가입자수: item.count || 0 };
          }

          return {
            date: format(date, 'MM/dd'),
            가입자수: item.count || 0
          };
        } catch (e) {
          console.error('날짜 변환 오류:', e, item);
          return { date: item.date || item.label || '-', 가입자수: item.count || 0 };
        }
      });

      setTrendData(formattedData);
    } catch (error: any) {
      console.error('사용자 지정 기간 데이터 조회 중 오류:', error);

      // 인증 오류 처리
      if (error.response?.status === 401) {
        setCustomError('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        setCustomError(
          error.response?.data?.message ||
          error.message ||
          '데이터를 불러오는데 실패했습니다.'
        );
      }
    } finally {
      setCustomLoading(false);
    }
  };

  // 인증 상태 확인
  const checkAuthStatus = () => {
    const token = localStorage.getItem('accessToken');
    const isAdmin = localStorage.getItem('isAdmin');

    if (!token || isAdmin !== 'true') {
      setCustomError('관리자 권한이 필요합니다. 다시 로그인해주세요.');
      return false;
    }

    return true;
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // 인증 상태 확인
    if (!checkAuthStatus()) return;

    // 시작일과 종료일이 유효한 경우에만 데이터 로드
    if (startDate && endDate && isDateRangeValid()) {
      fetchCustomPeriodData();
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          회원가입 추이 ({regionLabel})
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

            {/* 기간별 탭 */}
            <TabPanel value={activeTab} index={3}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={5}>
                    <DatePicker
                      label="시작일"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <DatePicker
                      label="종료일"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
                    <Button
                      variant="contained"
                      onClick={fetchCustomPeriodData}
                      disabled={customLoading || !isDateRangeValid()}
                      fullWidth
                      sx={{ height: '40px' }}
                    >
                      {customLoading ? <CircularProgress size={24} /> : '조회'}
                    </Button>
                  </Grid>
                </Grid>
              </LocalizationProvider>

              {customLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    데이터를 불러오는 중...
                  </Typography>
                </Box>
              )}

              {customError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {customError}
                </Alert>
              )}

              {!customLoading && (
                <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="h5" align="center">
                    선택 기간 내 총 회원가입자 수: <strong id="signup-count">{`${signupCount}명`}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                    {startDate && endDate ? `${format(startDate, 'yyyy년 MM월 dd일')} ~ ${format(endDate, 'yyyy년 MM월 dd일')}` : ''}
                  </Typography>
                </Paper>
              )}

              {!customLoading && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    일별 회원가입 추이
                  </Typography>
                  {trendData.length > 0 ? (
                    <Box sx={{ height: 400 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={trendData}
                          margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            interval={Math.max(1, Math.floor(trendData.length / 10))}
                            angle={-45}
                            textAnchor="end"
                            height={70}
                          />
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
                  ) : (
                    <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                      <Typography color="textSecondary">
                        선택한 기간에 대한 데이터가 없습니다.
                      </Typography>
                    </Box>
                  )}
                </Box>
              )}
            </TabPanel>
          </>
        )}
      </CardContent>
    </Card>
  );
}
