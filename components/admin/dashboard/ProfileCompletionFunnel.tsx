import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Alert,
  Divider,
  Chip
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

// 프로필 완성도 타입 정의
type ProfileCompletionData = {
  notStarted: number;
  basic: number;
  partial: number;
  mostlyComplete: number;
  complete: number;
};

type GenderProfileCompletion = {
  male: { total: number; count: number; average: number };
  female: { total: number; count: number; average: number };
};

type UserActivityResponse = {
  periodType: string;
  mau: number;
  dau: number;
  dauMauRatio: number;
  totalUsers: number;
  mauPercentage: number;
  profileCompletionStages: ProfileCompletionData;
  genderProfileCompletion: GenderProfileCompletion;
  weeklyReturnRate: number;
};

const ProfileCompletionFunnel = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UserActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 색상 정의
  const COLORS = {
    male: '#4A90E2',
    female: '#D85888',
    notStarted: '#BBDEFB',
    basic: '#90CAF9',
    partial: '#64B5F6',
    mostlyComplete: '#42A5F5',
    complete: '#2196F3',
    success: '#66BB6A',
    warning: '#FFC107',
    danger: '#F44336'
  };

  const fetchUserActivityData = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/stats/user-activity');
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('사용자 활동 데이터 조회 오류:', err);
      setError('데이터를 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserActivityData();
  }, []);

  // 프로필 완성도 퍼널 데이터 가공
  const profileFunnelData = data?.profileCompletionStages ? [
    { name: '미시작 (0%)', value: data.profileCompletionStages.notStarted, fillColor: COLORS.notStarted },
    { name: '기본 (1-25%)', value: data.profileCompletionStages.basic, fillColor: COLORS.basic },
    { name: '절반 (26-50%)', value: data.profileCompletionStages.partial, fillColor: COLORS.partial },
    { name: '대부분 (51-75%)', value: data.profileCompletionStages.mostlyComplete, fillColor: COLORS.mostlyComplete },
    { name: '완료 (76-100%)', value: data.profileCompletionStages.complete, fillColor: COLORS.complete }
  ] : [];

  // 성별 프로필 완성도 비교 데이터
  const genderComparisonData = data?.genderProfileCompletion ? [
    { name: '남성', value: data.genderProfileCompletion.male.average },
    { name: '여성', value: data.genderProfileCompletion.female.average }
  ] : [];

  // MAU/DAU 원형 차트 데이터
  const mauDauData = data ? [
    { name: 'MAU', value: data.mau },
    { name: '비활성 사용자', value: data.totalUsers - data.mau }
  ] : [];

  const ACTIVITY_COLORS = ['#66BB6A', '#EEEEEE'];

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          사용자 활동 및 프로필 완성도
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <div className="w-12 h-12 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin"></div>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>MAU</Typography>
                    <Typography variant="h4">{data?.mau.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      목표: 35,000 | 현재: {data?.mauPercentage}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>DAU</Typography>
                    <Typography variant="h4">{data?.dau.toLocaleString()}</Typography>
                    <Typography variant="body2" color="textSecondary">
                      DAU/MAU: {data?.dauMauRatio}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>주간 재방문율</Typography>
                    <Typography variant="h4">{data?.weeklyReturnRate}%</Typography>
                    <Chip 
                      label={data?.weeklyReturnRate >= 30 ? "양호" : "개선 필요"} 
                      color={data?.weeklyReturnRate >= 30 ? "success" : "warning"} 
                      size="small" 
                      sx={{ mt: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>완성된 프로필</Typography>
                    <Typography variant="h4">
                      {data?.profileCompletionStages.complete}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {data?.totalUsers ? Math.round(data.profileCompletionStages.complete / data.totalUsers * 100) : 0}% 완성됨
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Grid container spacing={4}>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" gutterBottom>
                  프로필 완성도 단계별 현황
                </Typography>
                <Box sx={{ height: 350 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={profileFunnelData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar 
                        dataKey="value" 
                        name="사용자 수" 
                        radius={[0, 4, 4, 0]}
                      >
                        {profileFunnelData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fillColor} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom>
                  월간 활성 사용자 (MAU)
                </Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={mauDauData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {mauDauData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name === "MAU" ? "활성 사용자" : "비활성 사용자"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">
                    활성 사용자 비율: {data?.mauPercentage}%
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    목표: 30% 이상
                  </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Typography variant="subtitle1" gutterBottom>
                  성별 프로필 완성도
                </Typography>
                <Box sx={{ height: 80 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        남성
                      </Typography>
                      <Typography variant="h5" align="center" color={COLORS.male}>
                        {data?.genderProfileCompletion.male.average}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" align="center">
                        여성
                      </Typography>
                      <Typography variant="h5" align="center" color={COLORS.female}>
                        {data?.genderProfileCompletion.female.average}%
                      </Typography>
                    </Grid>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletionFunnel;
