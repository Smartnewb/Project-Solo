'use client';

import { useState, useEffect } from 'react';
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
import AdminService from '@/app/services/admin';
import { getRegionLabel } from '@/components/admin/common/RegionFilter';

// 대학 목록 (정렬된 상태로 유지)
const UNIVERSITIES = [
  '건양대학교',
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

interface UniversityStatsCardProps {
  region?: string;
}

// 대학별 통계 카드 컴포넌트
export default function UniversityStatsCard({ region }: UniversityStatsCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 실제 API 응답 구조에 맞게 타입 설정
  const [stats, setStats] = useState<{
    universities: Array<{
      universityName: string;
      totalCount: number;
      maleCount: number;
      femaleCount: number;
      percentage: number;
      genderRatio: string;
    }>;
    totalCount: number;
  } | null>(null);

  // 지역 라벨 생성
  const regionLabel = region ? getRegionLabel(region as any) : '전체 지역';

  // 데이터 조회
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // API 호출
        const response = await AdminService.stats.getUniversityStats(region);
        console.log('대학별 통계 응답:', response);
        console.log('대학별 통계 데이터 구조:', JSON.stringify(response, null, 2));

        // API 응답 구조 확인
        console.log('실제 API 응답 구조 확인:');
        console.log('response 타입:', typeof response);
        console.log('response 키:', Object.keys(response));

        if (response && response.universities) {
          console.log('universities 타입:', typeof response.universities);
          console.log('universities 길이:', response.universities.length);

          if (response.universities.length > 0) {
            console.log('첫 번째 대학 데이터 키:', Object.keys(response.universities[0]));

            // 데이터 값 확인
            const firstUni = response.universities[0];
            console.log('첫 번째 대학 상세 데이터:');
            for (const key in firstUni) {
              console.log(`- ${key}:`, firstUni[key], typeof firstUni[key]);
            }

            // 모든 대학 데이터 확인
            response.universities.forEach((uni, index) => {
              console.log(`대학 ${index}:`, uni);
              console.log(`대학명: ${uni.university}, 전체 회원: ${uni.totalUsers}, 남성: ${uni.maleUsers}, 여성: ${uni.femaleUsers}`);
            });
          }

          // 실제 API 데이터 사용
          setStats(response);
        } else {
          console.log('대학 데이터가 없습니다.');
          setError('대학별 통계 데이터가 없습니다.');
        }
      } catch (error: any) {
        console.error('대학별 통계 조회 중 오류:', error);
        setError(
          error.response?.data?.message ||
          error.message ||
          '데이터를 불러오는데 실패했습니다.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region]);

  // 차트 데이터 생성
  const chartData = stats?.universities?.map((uni, index) => {
    // 대학명 가져오기
    const universityName = uni.universityName || '-';

    // 데이터 가져오기 - 실제 API 응답 구조에 맞게 처리
    const maleCount = uni.maleCount || 0;
    const femaleCount = uni.femaleCount || 0;
    const totalCount = uni.totalCount || 0;

    const result = {
      name: universityName,
      남성: maleCount,
      여성: femaleCount,
      총회원수: totalCount
    };

    console.log(`차트 데이터 ${index}:`, result);
    return result;
  }) || [];

  // 디버깅용 로그
  console.log('차트 데이터:', chartData);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          대학별 통계 ({regionLabel})
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
            {error}
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
                    // 디버깅용 로그
                    console.log(`테이블 행 ${index}:`, uni);

                    // 데이터 가져오기 - 실제 API 응답 구조에 맞게 처리
                    const universityName = uni.universityName || '-';

                    // 데이터 값 확인 및 디버깅
                    console.log(`테이블 행 ${index} 상세 데이터:`);
                    console.log('- universityName:', uni.universityName);
                    console.log('- totalCount:', uni.totalCount);
                    console.log('- maleCount:', uni.maleCount);
                    console.log('- femaleCount:', uni.femaleCount);
                    console.log('- percentage:', uni.percentage);
                    console.log('- genderRatio:', uni.genderRatio);

                    // 데이터 가져오기
                    const maleCount = uni.maleCount || 0;
                    const femaleCount = uni.femaleCount || 0;
                    const totalCount = uni.totalCount || 0;
                    const percentage = uni.percentage || 0;
                    const genderRatio = uni.genderRatio || '0:0';

                    console.log(`행 ${index} 처리된 데이터:`, {
                      universityName,
                      totalCount,
                      maleCount,
                      femaleCount,
                      percentage,
                      genderRatio
                    });

                    return (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {/* 대학명 표시 - 인덱스를 사용하여 하드코딩된 목록에서 가져옴 */}
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
