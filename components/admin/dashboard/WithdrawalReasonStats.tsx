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
  TableRow,
  TextField,
  Button,
  Stack
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import AdminService from '@/app/services/admin';
import { format } from 'date-fns';

// 색상 배열
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function WithdrawalReasonStats() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reasonStats, setReasonStats] = useState<any[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [periodError, setPeriodError] = useState<string | null>(null);

  // 기본 데이터 생성 함수
  const getDefaultReasonStats = () => [
    { reason: 'FOUND_PARTNER', displayName: '파트너를 찾아서', count: 0, percentage: 0 },
    { reason: 'POOR_MATCHING', displayName: '매칭 품질이 좋지 않아서', count: 0, percentage: 0 },
    { reason: 'PRIVACY_CONCERN', displayName: '개인정보 보호 우려', count: 0, percentage: 0 },
    { reason: 'SAFETY_CONCERN', displayName: '안전 우려', count: 0, percentage: 0 },
    { reason: 'TECHNICAL_ISSUES', displayName: '기술적 문제', count: 0, percentage: 0 },
    { reason: 'INACTIVE_USAGE', displayName: '서비스를 잘 사용하지 않아서', count: 0, percentage: 0 },
    { reason: 'DISSATISFIED_SERVICE', displayName: '서비스에 불만족', count: 0, percentage: 0 },
    { reason: 'OTHER', displayName: '기타 사유', count: 0, percentage: 0 }
  ];

  // 데이터 조회 함수
  const fetchData = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    setPeriodError(null);

    try {
      const response = await AdminService.stats.getWithdrawalReasonStats(start, end);
      console.log('탈퇴 사유 통계 응답:', response);

      if (response?.reasons && Array.isArray(response.reasons) && response.reasons.length > 0) {
        setReasonStats(response.reasons);
      } else {
        console.warn('탈퇴 사유 데이터가 없습니다. 기본 데이터를 사용합니다.');
        setReasonStats(getDefaultReasonStats());
        setError('탈퇴 사유 데이터가 없습니다. 샘플 데이터를 표시합니다.');
      }
    } catch (error) {
      console.error('탈퇴 사유 통계 API 호출 실패:', error);
      console.error('오류 상세:', error instanceof Error ? error.message : '알 수 없는 오류');

      // API 호출 실패 시 기본 데이터 사용
      setReasonStats(getDefaultReasonStats());
      setError('데이터를 불러오는데 실패했습니다. 샘플 데이터를 표시합니다.');
    } finally {
      setLoading(false);
    }
  };

  // 기간별 조회 함수
  const handlePeriodSearch = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setPeriodError('시작일은 종료일보다 이전이어야 합니다.');
        return;
      }
      fetchData(startDate, endDate);
    } else if (startDate || endDate) {
      setPeriodError('시작일과 종료일을 모두 입력해주세요.');
    } else {
      // 둘 다 비어있으면 전체 기간 조회
      fetchData();
    }
  };

  // 전체 기간 조회 함수
  const handleResetPeriod = () => {
    setStartDate('');
    setEndDate('');
    setPeriodError(null);
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    return reasonStats.map(item => ({
      name: item.displayName || item.reason,
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

        {/* 기간 선택 컨트롤 */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            조회 기간 설정 (선택사항)
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <TextField
              label="시작일"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <TextField
              label="종료일"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="contained"
              onClick={handlePeriodSearch}
              disabled={loading}
              size="small"
            >
              조회
            </Button>
            <Button
              variant="outlined"
              onClick={handleResetPeriod}
              disabled={loading}
              size="small"
            >
              전체 기간
            </Button>
          </Stack>
          {periodError && (
            <Alert severity="error" sx={{ mt: 1 }}>
              {periodError}
            </Alert>
          )}
          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
            기간을 선택하지 않으면 전체 기간의 통계를 조회합니다.
          </Typography>
        </Box>

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
                        {row.displayName || row.reason}
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
