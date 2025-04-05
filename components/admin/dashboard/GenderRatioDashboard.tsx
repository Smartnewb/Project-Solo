import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Grid, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem
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
  Cell
} from 'recharts';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';

// 성비 타입 정의
type GenderRatioData = {
  university: string;
  male: number;
  female: number;
  total: number;
  femalePercentage: number;
  isWarning: boolean;
  isCritical: boolean;
};

type GenderRatioResponse = {
  universities: GenderRatioData[];
  total: {
    male: number;
    female: number;
    total: number;
    femalePercentage: number;
    isWarning: boolean;
    isCritical: boolean;
  };
};

const GenderRatioDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<GenderRatioResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30일 전
  );
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [filterUniversity, setFilterUniversity] = useState<string>("");

  // 색상 정의
  const COLORS = {
    male: '#4A90E2',
    female: '#D85888',
    neutral: '#66BB6A',
    warning: '#FFC107',
    critical: '#F44336'
  };

  const fetchGenderRatioData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }
      if (endDate) {
        params.append('endDate', endDate.toISOString());
      }
      
      const response = await fetch(`/api/admin/stats/gender-ratio?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      console.error('성비 데이터 조회 오류:', err);
      setError('데이터를 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGenderRatioData();
  }, [startDate, endDate]);

  // 대학 필터링
  const filteredData = data?.universities.filter(uni => 
    !filterUniversity || uni.university.includes(filterUniversity)
  );

  const chartData = filteredData?.map(uni => ({
    name: uni.university,
    남성: uni.male,
    여성: uni.female,
    femalePercentage: uni.femalePercentage
  }));

  const getStatusChip = (ratio: number) => {
    if (ratio < 20) {
      return <Chip label="심각" color="error" size="small" />;
    } else if (ratio < 25) {
      return <Chip label="경고" color="warning" size="small" />;
    } else if (ratio < 35) {
      return <Chip label="주의" color="info" size="small" />;
    } else {
      return <Chip label="양호" color="success" size="small" />;
    }
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          성비 균형 대시보드
        </Typography>

        {data?.total?.isWarning && (
          <Alert 
            severity={data.total.isCritical ? "error" : "warning"} 
            sx={{ mb: 2 }}
          >
            {data.total.isCritical 
              ? `심각: 전체 여성 비율이 ${data.total.femalePercentage}%로 매우 낮습니다. 즉시 조치가 필요합니다.` 
              : `경고: 전체 여성 비율이 ${data.total.femalePercentage}%로 목표치(25%) 미만입니다.`}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>

        <TextField
          label="대학명 필터"
          variant="outlined"
          value={filterUniversity}
          onChange={(e) => setFilterUniversity(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <div className="w-12 h-12 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin"></div>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>전체 사용자</Typography>
                    <Typography variant="h4">{data?.total.total.toLocaleString()}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>전체 여성 비율</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h4" sx={{ mr: 1 }}>{data?.total.femalePercentage}%</Typography>
                      {getStatusChip(data?.total.femalePercentage || 0)}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>조회된 대학 수</Typography>
                    <Typography variant="h4">{filteredData?.length || 0}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis />
                  <Tooltip formatter={(value, name) => [value, name === '여성 비율(%)' ? '여성 비율' : name]} />
                  <Legend />
                  <Bar dataKey="남성" stackId="a" fill={COLORS.male} name="남성" />
                  <Bar dataKey="여성" stackId="a" fill={COLORS.female} name="여성" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                대학별 성비 상세
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>대학</TableCell>
                      <TableCell align="right">총 인원</TableCell>
                      <TableCell align="right">남성</TableCell>
                      <TableCell align="right">여성</TableCell>
                      <TableCell align="right">여성 비율</TableCell>
                      <TableCell align="center">상태</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredData?.map((uni) => (
                      <TableRow key={uni.university}>
                        <TableCell component="th" scope="row">
                          {uni.university}
                        </TableCell>
                        <TableCell align="right">{uni.total}</TableCell>
                        <TableCell align="right">{uni.male}</TableCell>
                        <TableCell align="right">{uni.female}</TableCell>
                        <TableCell align="right">{uni.femalePercentage}%</TableCell>
                        <TableCell align="center">
                          {getStatusChip(uni.femalePercentage)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default GenderRatioDashboard;
