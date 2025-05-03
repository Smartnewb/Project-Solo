'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { hooks } from '@/lib/query';

// 대학 목록 (정렬된 상태로 유지)
const UNIVERSITIES = [
  '건양대학교(메디컬캠퍼스)',
  '대전대학교',
  '목원대학교',
  '배재대학교',
  '우송대학교',
  '한남대학교',
  '충남대학교',
  'KAIST',
  '한밭대학교',
  '을지대학교',
  '대전보건대학교',
  '대덕대학교'
];

// 대학별 통계 카드 컴포넌트
export default function UniversityStatsCard() {
  // React Query 훅 사용 - 대시보드 데이터에서 대학별 통계 가져오기
  const { data, isLoading: loading, error } = hooks.useDashboardData();

  // 대시보드 데이터에서 대학별 통계 추출
  const stats = data?.universityStats || null;

  // 차트 데이터 생성
  const chartData = stats?.universities?.map((uni, index) => {
    // 대학명 가져오기
    const universityName = uni.university || '-';

    // 데이터 가져오기 - 실제 API 응답 구조에 맞게 처리
    const maleCount = uni.maleUsers || 0;
    const femaleCount = uni.femaleUsers || 0;
    const totalCount = uni.totalUsers || 0;

    return {
      name: universityName,
      남성: maleCount,
      여성: femaleCount,
      총회원수: totalCount
    };
  }) || [];

  // 에러 메시지 처리
  const errorMessage = error instanceof Error ? error.message : '데이터를 불러오는데 실패했습니다.';

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          대학별 통계
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              데이터를 불러오는 중...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        )}

        {!loading && !error && (!stats || !stats.universities || stats.universities.length === 0) && (
          <Alert severity="info" sx={{ mb: 2 }}>
            대학별 통계 데이터가 없습니다.
          </Alert>
        )}

        {!loading && !error && stats && stats.universities && stats.universities.length > 0 && (
          <>
            {/* 차트 영역 */}
            <Box sx={{ height: 400, mb: 4 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    angle={-45}
                    textAnchor="end"
                    height={70}
                  />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="남성" fill="#0088FE" />
                  <Bar dataKey="여성" fill="#FF8042" />
                </BarChart>
              </ResponsiveContainer>
            </Box>

            {/* 테이블 영역 */}
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>대학</TableCell>
                    <TableCell align="right">전체 회원</TableCell>
                    <TableCell align="right">비율</TableCell>
                    <TableCell align="right">남성</TableCell>
                    <TableCell align="right">여성</TableCell>
                    <TableCell align="right">성비(남:여)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* 테이블 표시 */}
                  {stats?.universities?.map((uni, index) => {
                    // 데이터 가져오기
                    const universityName = uni.university || '-';
                    const maleCount = uni.maleUsers || 0;
                    const femaleCount = uni.femaleUsers || 0;
                    const totalCount = uni.totalUsers || 0;
                    const percentage = uni.percentage || 0;
                    const genderRatio = uni.genderRatio || '0:0';

                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {universityName}
                        </TableCell>
                        <TableCell align="right">
                          <strong>{totalCount.toLocaleString()}명</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress
                                variant="determinate"
                                value={percentage}
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>{percentage.toFixed(1)}%</strong>
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <strong style={{ color: '#0088FE' }}>{maleCount.toLocaleString()}명</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong style={{ color: '#FF8042' }}>{femaleCount.toLocaleString()}명</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Tooltip title={`남성 ${maleCount}명, 여성 ${femaleCount}명`}>
                            <Chip
                              label={genderRatio}
                              color={genderRatio.includes(':1') ? 'success' : 'warning'}
                              size="small"
                            />
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </CardContent>
    </Card>
  );
}
