import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Alert,
  LinearProgress,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid
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

// 대학별 성과 타입 정의
type UniversityData = {
  university: string;
  total: number;
  male: number;
  female: number;
  femalePercentage: number;
  targetPercentage: number;
  achievementRate: number;
  isWarning: boolean;
  isCritical: boolean;
};

type MonthlyTrend = {
  month: string;
  universities: Record<string, {
    total: number;
    female: number;
    femalePercentage: number;
  }>;
};

type UniversityPerformanceResponse = {
  universities: UniversityData[];
  monthlyTrends: MonthlyTrend[];
  universityTargets: Record<string, number>;
};

const UniversityPerformanceTable = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<UniversityPerformanceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterUniversity, setFilterUniversity] = useState<string>("");
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);

  // 색상 정의
  const COLORS = {
    success: '#66BB6A',
    warning: '#FFC107',
    danger: '#F44336',
    neutral: '#9E9E9E'
  };

  const universityLineColors: Record<string, string> = {
    '한밭대': '#4A90E2',
    '충남대': '#D85888',
    '충북대': '#66BB6A',
    '공주대': '#9C27B0',
    '배재대': '#FF9800',
    '한남대': '#8884d8',
    '목원대': '#4CAF50',
  };

  const fetchUniversityData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filterUniversity) {
        params.append('university', filterUniversity);
      }
      
      const response = await fetch(`/api/admin/stats/university-performance?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('데이터를 불러오는데 실패했습니다.');
      }
      
      const result = await response.json();
      setData(result);
      
      // 초기 선택된 대학 설정 (상위 3개)
      if (result.universities.length > 0 && selectedUniversities.length === 0) {
        setSelectedUniversities(result.universities.slice(0, 3).map(uni => uni.university));
      }
      
      setError(null);
    } catch (err) {
      console.error('대학별 성과 데이터 조회 오류:', err);
      setError('데이터를 불러오는데 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUniversityData();
  }, [filterUniversity]);

  // 대학 필터링
  const filteredData = data?.universities.filter(uni => 
    !filterUniversity || uni.university.includes(filterUniversity)
  );

  // 월별 추이 차트 데이터 가공
  const formatTrendData = () => {
    if (!data?.monthlyTrends || selectedUniversities.length === 0) return [];
    
    return data.monthlyTrends.map(monthData => {
      const result: any = {
        month: monthData.month
      };
      
      selectedUniversities.forEach(uni => {
        if (monthData.universities[uni]) {
          result[uni] = monthData.universities[uni].femalePercentage;
        } else {
          result[uni] = 0;
        }
      });
      
      return result;
    });
  };

  // 진행률 표시를 위한 색상 계산
  const getProgressColor = (achievementRate: number) => {
    if (achievementRate >= 100) return COLORS.success;
    if (achievementRate >= 70) return COLORS.warning;
    return COLORS.danger;
  };

  // 차트 표시용 날짜 포맷
  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year.slice(2)}.${monthNum}`;
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          대학별 성과 현황
        </Typography>

        <TextField
          label="대학명 필터"
          variant="outlined"
          value={filterUniversity}
          onChange={(e) => setFilterUniversity(e.target.value)}
          fullWidth
          margin="normal"
          size="small"
          sx={{ mb: 2 }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <div className="w-12 h-12 border-4 border-primary-DEFAULT border-t-transparent border-solid rounded-full animate-spin"></div>
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          <>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>대학</TableCell>
                    <TableCell align="right">총 인원</TableCell>
                    <TableCell align="right">여성 인원</TableCell>
                    <TableCell align="right">현재 비율</TableCell>
                    <TableCell align="right">목표 비율</TableCell>
                    <TableCell align="right">달성률</TableCell>
                    <TableCell>진행 상황</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData?.map((uni) => (
                    <TableRow 
                      key={uni.university} 
                      sx={uni.isCritical ? { backgroundColor: 'rgba(244, 67, 54, 0.1)' } : uni.isWarning ? { backgroundColor: 'rgba(255, 193, 7, 0.1)' } : {}}
                    >
                      <TableCell component="th" scope="row">
                        {uni.university}
                      </TableCell>
                      <TableCell align="right">{uni.total}</TableCell>
                      <TableCell align="right">{uni.female}</TableCell>
                      <TableCell align="right">{uni.femalePercentage}%</TableCell>
                      <TableCell align="right">{uni.targetPercentage}%</TableCell>
                      <TableCell align="right">{uni.achievementRate}%</TableCell>
                      <TableCell sx={{ width: '30%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress 
                              variant="determinate" 
                              value={Math.min(uni.achievementRate, 100)} 
                              sx={{ 
                                height: 8, 
                                borderRadius: 5,
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                                '& .MuiLinearProgress-bar': {
                                  backgroundColor: getProgressColor(uni.achievementRate)
                                }
                              }} 
                            />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">{Math.min(uni.achievementRate, 100)}%</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ mt: 4 }}>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom>
                    월별 여성 비율 추이
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>대학 선택 (최대 5개)</InputLabel>
                    <Select
                      multiple
                      value={selectedUniversities}
                      onChange={(e) => {
                        const value = Array.isArray(e.target.value) ? 
                          e.target.value.slice(0, 5) : // 최대 5개로 제한
                          [e.target.value];
                        setSelectedUniversities(value);
                      }}
                      renderValue={(selected) => (Array.isArray(selected) ? selected.join(', ') : selected)}
                      label="대학 선택 (최대 5개)"
                    >
                      {data?.universities.map((uni) => (
                        <MenuItem 
                          key={uni.university} 
                          value={uni.university}
                          disabled={selectedUniversities.length >= 5 && !selectedUniversities.includes(uni.university)}
                        >
                          {uni.university}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={formatTrendData()}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={formatMonth}
                    />
                    <YAxis domain={[0, 'dataMax + 5']} unit="%" />
                    <Tooltip
                      formatter={(value, name) => [`${value}%`, name]}
                      labelFormatter={(label) => `${formatMonth(label)}월`}
                    />
                    <Legend />
                    {selectedUniversities.map((uni, index) => (
                      <Line
                        key={uni}
                        type="monotone"
                        dataKey={uni}
                        name={uni}
                        stroke={universityLineColors[uni] || `#${Math.floor(Math.random()*16777215).toString(16)}`}
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UniversityPerformanceTable;
