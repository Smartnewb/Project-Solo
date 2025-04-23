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
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminService from '@/app/services/admin';

export default function ServiceDurationStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [durationStats, setDurationStats] = useState<any[]>([]);
  const [averageDuration, setAverageDuration] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        try {
          const response = await AdminService.stats.getServiceDurationStats();
          console.log('서비스 사용 기간 통계 응답:', response);

          if (response?.durations && Array.isArray(response.durations) && response.durations.length > 0) {
            setDurationStats(response.durations);
            setAverageDuration(response.averageDuration || null);
          } else {
            // 데이터가 없는 경우 기본 데이터 생성
            const sampleData = [
              { range: '0-7일', count: 0, percentage: 0 },
              { range: '8-30일', count: 0, percentage: 0 },
              { range: '1-3개월', count: 0, percentage: 0 },
              { range: '3-6개월', count: 0, percentage: 0 },
              { range: '6-12개월', count: 0, percentage: 0 },
              { range: '1년 이상', count: 0, percentage: 0 }
            ];
            setDurationStats(sampleData);
            setAverageDuration(0);
            setError('서비스 사용 기간 데이터가 없습니다. 샘플 데이터를 표시합니다.');
          }
        } catch (apiError) {
          console.error('API 호출 오류:', apiError);
          // 오류 발생 시 기본 데이터 생성
          const sampleData = [
            { range: '0-7일', count: 0, percentage: 0 },
            { range: '8-30일', count: 0, percentage: 0 },
            { range: '1-3개월', count: 0, percentage: 0 },
            { range: '3-6개월', count: 0, percentage: 0 },
            { range: '6-12개월', count: 0, percentage: 0 },
            { range: '1년 이상', count: 0, percentage: 0 }
          ];
          setDurationStats(sampleData);
          setAverageDuration(0);
          setError('데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.');
        }
      } catch (err) {
        console.error('서비스 사용 기간 통계 조회 중 오류:', err);
        setError('데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    return durationStats.map(item => ({
      name: item.range,
      '사용자수': item.count,
      percentage: item.percentage
    }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            서비스 사용 기간 통계
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
            서비스 사용 기간 통계
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
          서비스 사용 기간 통계
        </Typography>

        {averageDuration !== null && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" align="center" color="primary">
              평균 서비스 사용 기간: {averageDuration.toFixed(1)}일
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {/* 바 차트 */}
          <Grid item xs={12} md={7}>
            <Box sx={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formatChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${value.toLocaleString()}명`,
                      '사용자수'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="사용자수" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          {/* 테이블 */}
          <Grid item xs={12} md={5}>
            <TableContainer component={Paper} sx={{ maxHeight: 400, overflow: 'auto' }}>
              <Table stickyHeader aria-label="서비스 사용 기간 통계 테이블">
                <TableHead>
                  <TableRow>
                    <TableCell>사용 기간</TableCell>
                    <TableCell align="right">인원수</TableCell>
                    <TableCell align="right">비율</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {durationStats.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell component="th" scope="row">
                        {row.range}
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
