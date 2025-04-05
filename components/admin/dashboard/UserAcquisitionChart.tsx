import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';

// 가입자 통계 타입 정의
type DailySignupData = {
  date: string;
  total: number;
  male: number;
  female: number;
};

type UniversitySignupData = {
  university: string;
  total: number;
  male: number;
  female: number;
  femalePercentage: number;
};

type ReferralData = {
  referralCode: string;
  count: number;
  isFemaleReferrer: boolean;
};

type SignupsResponse = {
  periodType: string;
  startDate: string;
  endDate: string;
  totalSignups: number;
  maleSignups: number;
  femaleSignups: number;
  femalePercentage: number;
  dailySignups: DailySignupData[];
  universitySignups: UniversitySignupData[];
  referrals: ReferralData[];
};

const UserAcquisitionChart = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SignupsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<string>('month');

  // 색상 정의
  const COLORS = {
    male: '#4A90E2',
    female: '#D85888',
    neutral: '#66BB6A',
    total: '#9C27B0'
  };

  const fetchSignupsData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      params.append('period', period);
      
      const response = await fetch(`/api/admin/stats/signups?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('가입자 데이터 조회 오류:', err);
      setError('데이터를 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignupsData();
  }, [period]);

  const formatLineChartData = () => {
    if (!data?.dailySignups) return [];
    
    // 일간 데이터를 날짜순으로 정렬
    return [...data.dailySignups].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    ).map(day => ({
      date: new Date(day.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      total: day.total,
      남성: day.male,
      여성: day.female
    }));
  };

  // 상위 5개 대학 필터링
  const topUniversities = data?.universitySignups.slice(0, 5) || [];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          사용자 유입 현황
        </Typography>

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>기간</InputLabel>
              <Select
                value={period}
                label="기간"
                onChange={(e) => setPeriod(e.target.value)}
              >
                <MenuItem value="day">일간</MenuItem>
                <MenuItem value="week">주간</MenuItem>
                <MenuItem value="month">월간</MenuItem>
                <MenuItem value="year">연간</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <div className="w-12 h-12 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin"></div>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>총 가입자</Typography>
                    <Typography variant="h4">{data?.totalSignups.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {period === 'day' ? '오늘' : 
                       period === 'week' ? '이번 주' : 
                       period === 'month' ? '이번 달' : '올해'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>남성 가입자</Typography>
                    <Typography variant="h4">{data?.maleSignups.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {((data?.maleSignups || 0) / (data?.totalSignups || 1) * 100).toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>여성 가입자</Typography>
                    <Typography variant="h4">{data?.femaleSignups.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data?.femalePercentage.toFixed(1)}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>여성 초대 현황</Typography>
                    <Typography variant="h4">
                      {data?.referrals?.filter(r => r.isFemaleReferrer).reduce((sum, r) => sum + r.count, 0) || 0}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      여성이 초대한 친구 수
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                기간별 가입자 추이
              </Typography>
              <Box sx={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={formatLineChartData()}
                    margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="total" name="전체" stroke={COLORS.total} fill={COLORS.total} fillOpacity={0.1} />
                    <Area type="monotone" dataKey="남성" stroke={COLORS.male} fill={COLORS.male} fillOpacity={0.6} />
                    <Area type="monotone" dataKey="여성" stroke={COLORS.female} fill={COLORS.female} fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </Box>

            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid item xs={12} md={7}>
                <Typography variant="subtitle1" gutterBottom>
                  상위 대학별 가입 현황
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topUniversities.map(uni => ({
                        name: uni.university,
                        남성: uni.male,
                        여성: uni.female
                      }))}
                      margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="남성" fill={COLORS.male} />
                      <Bar dataKey="여성" fill={COLORS.female} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={5}>
                <Typography variant="subtitle1" gutterBottom>
                  여성 친구 초대 코드 효과
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.referrals.filter(r => r.isFemaleReferrer).slice(0, 5).map(ref => ({
                        name: ref.referralCode.substring(0, 8) + '...',
                        초대수: ref.count
                      }))}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="초대수" fill={COLORS.female} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UserAcquisitionChart;
