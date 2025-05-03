'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { adminService } from '@/lib/services';

// 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function WithdrawalReasonStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonStats, setReasonStats] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const response = await adminService.withdrawal.getWithdrawalReasonStats();
          console.log('탈퇴 사유 통계 응답:', response);

          if (response?.stats && Array.isArray(response.stats) && response.stats.length > 0) {
            setReasonStats(response.stats);
          } else {
            // 데이터가 없는 경우 기본 데이터 생성
            setReasonStats([
              { category: '서비스 불만족', count: 0, percentage: 0 },
              { category: '다른 서비스 이용', count: 0, percentage: 0 },
              { category: '개인정보 우려', count: 0, percentage: 0 },
              { category: '사용빈도 낮음', count: 0, percentage: 0 },
              { category: '기타', count: 0, percentage: 0 }
            ]);
            setError('탈퇴 사유 데이터가 없습니다. 샘플 데이터를 표시합니다.');
          }
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // 오류 발생 시 기본 데이터 생성
          setReasonStats([
            { category: '서비스 불만족', count: 0, percentage: 0 },
            { category: '다른 서비스 이용', count: 0, percentage: 0 },
            { category: '개인정보 우려', count: 0, percentage: 0 },
            { category: '사용빈도 낮음', count: 0, percentage: 0 },
            { category: '기타', count: 0, percentage: 0 }
          ]);
          setError('데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.');
        }
      } catch (err) {
        console.error('탈퇴 사유 통계 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    return reasonStats.map(item => ({
      name: item.category,
      value: item.count,
      percentage: item.percentage
    }));
  };

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper elevation={3} sx={{ p: 2, backgroundColor: 'white' }}>
          <Typography variant="body2" color="textPrimary">
            {payload[0].name}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {`${payload[0].value}명 (${payload[0].payload.percentage.toFixed(1)}%)`}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            탈퇴 사유 통계
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              데이터를 불러오는 중...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            탈퇴 사유 통계
          </Typography>
          <Alert severity="error">{error}</Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          탈퇴 사유 통계
        </Typography>

        <Grid container spacing={3}>
          {/* 파이 차트 */}
          <Grid item xs={12} md={6}>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={formatChartData()}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(1)}%)`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {formatChartData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* 테이블 */}
          <Grid item xs={12} md={6}>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader aria-label="탈퇴 사유 통계 테이블">
                <TableHead>
                  <TableRow>
                    <TableCell>탈퇴 사유</TableCell>
                    <TableCell align="right">인원수</TableCell>
                    <TableCell align="right">비율</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reasonStats.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row.category}
                      </TableCell>
                      <TableCell align="right">{row.count.toLocaleString()}명</TableCell>
                      <TableCell align="right">{row.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
