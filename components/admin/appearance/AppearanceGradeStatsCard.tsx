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
  // 데이터가 없는 경우 처리
  if (!stats || !stats.stats || !stats.genderStats) {
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

  // 차트 데이터 변환
  const chartData = stats.stats.map(item => ({
    name: GRADE_LABELS[item.grade] || '알 수 없음',
    value: item.count,
    percentage: item.percentage,
    grade: item.grade
  }));

  // 남성 차트 데이터
  const maleStats = stats.genderStats.find(g => g.gender === 'MALE')?.stats || [];
  const maleChartData = maleStats.map(item => ({
    name: GRADE_LABELS[item.grade] || '알 수 없음',
    value: item.count,
    percentage: item.percentage,
    grade: item.grade
  }));

  // 여성 차트 데이터
  const femaleStats = stats.genderStats.find(g => g.gender === 'FEMALE')?.stats || [];
  const femaleChartData = femaleStats.map(item => ({
    name: GRADE_LABELS[item.grade] || '알 수 없음',
    value: item.count,
    percentage: item.percentage,
    grade: item.grade
  }));

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box sx={{ bgcolor: 'background.paper', p: 2, border: '1px solid #ccc', borderRadius: 1 }}>
          <Typography variant="subtitle2">{payload[0].payload.name}</Typography>
          <Typography variant="body2">{payload[0].value}명 ({payload[0].payload.percentage.toFixed(1)}%)</Typography>
        </Box>
      );
    }
    return null;
  };

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
              전체 등급 분포 (총 {stats.total || 0}명)
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* 남성 통계 */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              남성 등급 분포
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maleChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {maleChartData.map((entry, index) => (
                      <Cell key={`cell-male-${index}`} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* 여성 통계 */}
          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" gutterBottom>
              여성 등급 분포
            </Typography>
            <Box sx={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={femaleChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {femaleChartData.map((entry, index) => (
                      <Cell key={`cell-female-${index}`} fill={GRADE_COLORS[entry.grade]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        {/* 등급별 상세 통계 */}
        <Grid container spacing={2}>
          {stats.stats.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={item.grade}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="h6" color={GRADE_COLORS[item.grade]}>
                      {GRADE_LABELS[item.grade]}
                    </Typography>
                    <Chip
                      label={`${item.percentage.toFixed(1)}%`}
                      size="small"
                      sx={{ bgcolor: GRADE_COLORS[item.grade], color: 'white' }}
                    />
                  </Box>
                  <Typography variant="body1">{item.count}명</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={item.percentage}
                    sx={{
                      mt: 1,
                      height: 8,
                      borderRadius: 1,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: GRADE_COLORS[item.grade]
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
