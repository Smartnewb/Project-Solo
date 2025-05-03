'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Divider,
  LinearProgress
} from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { UserAppearanceGradeStatsResponse } from '@/app/admin/users/appearance/types';

// 등급별 색상 정의
const GRADE_COLORS = {
  'S': '#8E44AD', // 보라색
  'A': '#3498DB', // 파란색
  'B': '#2ECC71', // 초록색
  'C': '#F39C12', // 주황색
  'UNKNOWN': '#95A5A6' // 회색
};

// 등급 한글 표시
const GRADE_LABELS = {
  'S': 'S등급',
  'A': 'A등급',
  'B': 'B등급',
  'C': 'C등급',
  'UNKNOWN': '미분류'
};

interface AppearanceGradeStatsCardProps {
  stats: UserAppearanceGradeStatsResponse;
}

export default function AppearanceGradeStatsCard({ stats }: AppearanceGradeStatsCardProps) {
  console.log('AppearanceGradeStatsCard에 전달된 데이터:', JSON.stringify(stats, null, 2));

  // 데이터 구조 분석
  if (stats) {
    console.log('통계 데이터 구조:');
    console.log('- total 값:', stats.total);
    console.log('- stats 배열 길이:', Array.isArray(stats.stats) ? stats.stats.length : 'stats가 배열이 아님');
    if (Array.isArray(stats.stats) && stats.stats.length > 0) {
      console.log('- stats 첫 번째 항목 구조:', stats.stats[0]);
    }
    console.log('- genderStats 배열 길이:', Array.isArray(stats.genderStats) ? stats.genderStats.length : 'genderStats가 배열이 아님');
    if (Array.isArray(stats.genderStats) && stats.genderStats.length > 0) {
      console.log('- genderStats 첫 번째 항목 구조:', stats.genderStats[0]);
    }
  }

  // 데이터 유효성 검사
  if (!stats) {
    console.error('통계 데이터가 없습니다.');
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            외모 등급 통계
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              통계 데이터를 불러올 수 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 필수 속성 확인 및 기본값 설정
  const safeStats = {
    total: stats.total || 0,
    stats: Array.isArray(stats.stats) ? stats.stats : [],
    genderStats: Array.isArray(stats.genderStats) ? stats.genderStats : []
  };

  // 데이터가 비어있는 경우 처리
  if (safeStats.stats.length === 0 && safeStats.genderStats.length === 0) {
    console.warn('통계 데이터가 비어있습니다:', stats);
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            외모 등급 통계
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <Typography variant="body1" color="text.secondary">
              아직 통계 데이터가 없습니다.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // 차트 데이터 변환 (빈 데이터 필터링 및 정렬)
  const chartData = safeStats.stats
    .filter(item => item && item.grade) // 유효한 항목만 필터링
    .map(item => ({
      name: GRADE_LABELS[item.grade as AppearanceGrade] || '알 수 없음',
      value: item.count || 0,
      percentage: typeof item.percentage === 'number' ? item.percentage : 0,
      grade: item.grade
    }))
    .filter(item => item.value > 0); // 값이 0인 항목 제외

  console.log('차트 데이터:', chartData);

  // 남성 차트 데이터
  const maleStats = safeStats.genderStats.find(g => g.gender === 'MALE')?.stats || [];
  const maleChartData = maleStats
    .filter(item => item && item.grade) // 유효한 항목만 필터링
    .map(item => ({
      name: GRADE_LABELS[item.grade as AppearanceGrade] || '알 수 없음',
      value: item.count || 0,
      percentage: typeof item.percentage === 'number' ? item.percentage : 0,
      grade: item.grade
    }))
    .filter(item => item.value > 0); // 값이 0인 항목 제외

  console.log('남성 차트 데이터:', maleChartData);

  // 여성 차트 데이터
  const femaleStats = safeStats.genderStats.find(g => g.gender === 'FEMALE')?.stats || [];
  const femaleChartData = femaleStats
    .filter(item => item && item.grade) // 유효한 항목만 필터링
    .map(item => ({
      name: GRADE_LABELS[item.grade as AppearanceGrade] || '알 수 없음',
      value: item.count || 0,
      percentage: typeof item.percentage === 'number' ? item.percentage : 0,
      grade: item.grade
    }))
    .filter(item => item.value > 0); // 값이 0인 항목 제외

  console.log('여성 차트 데이터:', femaleChartData);

  // 데이터가 있는지 확인
  const hasData = chartData.length > 0;
  const hasMaleData = maleChartData.length > 0;
  const hasFemaleData = femaleChartData.length > 0;

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="subtitle2">{data.name}</Typography>
          <Typography variant="body2">
            {data.value.toLocaleString()}명
            ({typeof data.percentage === 'number' ? data.percentage.toFixed(1) : '0.0'}%)
          </Typography>
        </Box>
      );
    }
    return null;
  };

  // 데이터가 없는 경우 표시할 메시지
  const EmptyChart = () => (
    <Box sx={{
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      p: 2
    }}>
      <Typography variant="body1" color="text.secondary" align="center">
        데이터가 없습니다
      </Typography>
    </Box>
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          외모 등급 통계
        </Typography>

        <Grid container spacing={3}>
          {/* 전체 통계 */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              전체 등급 분포 (총 {safeStats.total.toLocaleString()}명)
            </Typography>
            <Box sx={{ height: 250 }}>
              {hasData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value, percentage }) => `${percentage.toFixed(1)}% (${value}명)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={GRADE_COLORS[entry.grade as AppearanceGrade] || '#CCCCCC'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Box>
          </Grid>

          {/* 남성 통계 */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              남성 등급 분포
            </Typography>
            <Box sx={{ height: 250 }}>
              {hasMaleData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={maleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value, percentage }) => `${percentage.toFixed(1)}% (${value}명)`}
                    >
                      {maleChartData.map((entry, index) => (
                        <Cell
                          key={`cell-male-${index}`}
                          fill={GRADE_COLORS[entry.grade as AppearanceGrade] || '#CCCCCC'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Box>
          </Grid>

          {/* 여성 통계 */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              여성 등급 분포
            </Typography>
            <Box sx={{ height: 250 }}>
              {hasFemaleData ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={femaleChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value, percentage }) => `${percentage.toFixed(1)}% (${value}명)`}
                    >
                      {femaleChartData.map((entry, index) => (
                        <Cell
                          key={`cell-female-${index}`}
                          fill={GRADE_COLORS[entry.grade as AppearanceGrade] || '#CCCCCC'}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* 등급별 상세 통계 */}
        <Grid container spacing={2}>
          {safeStats.stats
            .filter(item => item && item.grade) // 유효한 항목만 필터링
            .sort((a, b) => {
              // 등급 순서: S, A, B, C, UNKNOWN
              const gradeOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'UNKNOWN': 4 };
              return (gradeOrder[a.grade as keyof typeof gradeOrder] || 999) -
                     (gradeOrder[b.grade as keyof typeof gradeOrder] || 999);
            })
            .map((item) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={item.grade}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                      <Typography variant="h6" color={GRADE_COLORS[item.grade as AppearanceGrade] || '#CCCCCC'}>
                        {GRADE_LABELS[item.grade as AppearanceGrade] || '알 수 없음'}
                      </Typography>
                      <Chip
                        label={`${typeof item.percentage === 'number' ? item.percentage.toFixed(1) : '0.0'}%`}
                        size="small"
                        sx={{ bgcolor: GRADE_COLORS[item.grade as AppearanceGrade] || '#CCCCCC', color: 'white' }}
                      />
                    </Box>
                    <Typography variant="body1">{(item.count || 0).toLocaleString()}명</Typography>
                    <LinearProgress
                      variant="determinate"
                      value={typeof item.percentage === 'number' ? Math.min(item.percentage, 100) : 0}
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 1,
                        backgroundColor: '#e0e0e0',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: GRADE_COLORS[item.grade as AppearanceGrade] || '#CCCCCC'
                        }
                      }}
                    />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
