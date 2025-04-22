'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import AdminService from '@/app/services/admin';
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

// 사용자 지정 기간 회원가입 통계 컴포넌트
export default function CustomPeriodSignupStats() {
  const [startDate, setStartDate] = useState<Date | null>(addDays(new Date(), -30)); // 기본값: 30일 전
  const [endDate, setEndDate] = useState<Date | null>(new Date()); // 기본값: 오늘
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signupCount, setSignupCount] = useState<number>(0);
  const [trendData, setTrendData] = useState<any[]>([]);

  // 날짜 유효성 검사
  const isDateRangeValid = () => {
    if (!startDate || !endDate) return false;
    if (isAfter(startDate, endDate)) return false;
    return true;
  };

  // 데이터 조회
  const fetchData = async () => {
    if (!isDateRangeValid()) {
      setError('유효한 날짜 범위를 선택해주세요.');
      return;
    }

    // 인증 상태 확인
    if (!checkAuthStatus()) return;

    setLoading(true);
    setError(null);

    try {
      // 날짜 형식 변환 (YYYY-MM-DD)
      const formattedStartDate = format(startDate as Date, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate as Date, 'yyyy-MM-dd');

      // 회원가입자 수 조회
      const countResponse = await AdminService.stats.getCustomPeriodSignupCount(
        formattedStartDate,
        formattedEndDate
      );

      console.log('회원가입자 수 응답:', countResponse);

      // API 응답 구조 상세 로깅
      console.log('응답 타입:', typeof countResponse);
      if (typeof countResponse === 'object' && countResponse !== null) {
        console.log('응답 객체 키:', Object.keys(countResponse));
      }

      // API 응답 구조에 따라 적절한 값 추출
      let count = 0;

      if (typeof countResponse === 'number') {
        count = countResponse;
      } else if (typeof countResponse === 'object' && countResponse !== null) {
        // totalSignups 필드 확인 (현재 응답 구조에 맞게 추가)
        if ('totalSignups' in countResponse) {
          count = countResponse.totalSignups;
        } else if ('count' in countResponse) {
          count = countResponse.count;
        } else if ('data' in countResponse && countResponse.data && typeof countResponse.data === 'object') {
          if ('totalSignups' in countResponse.data) {
            count = countResponse.data.totalSignups;
          } else if ('count' in countResponse.data) {
            count = countResponse.data.count;
          } else if (Array.isArray(countResponse.data) && countResponse.data.length > 0) {
            // 배열인 경우 개수 합산
            count = countResponse.data.reduce((sum, item) => sum + (item.count || 0), 0);
          }
        }
      }

      console.log('추출된 회원가입자 수:', count);
      console.log('필드 확인 - totalSignups 있는지:', 'totalSignups' in countResponse);
      console.log('전체 응답 객체:', countResponse);
      setSignupCount(count);

      // 회원가입 추이 조회
      const trendResponse = await AdminService.stats.getCustomPeriodSignupTrend(
        formattedStartDate,
        formattedEndDate
      );

      console.log('회원가입 추이 응답:', trendResponse);

      // API 응답 구조 상세 로깅
      console.log('추이 응답 타입:', typeof trendResponse);
      if (typeof trendResponse === 'object' && trendResponse !== null) {
        console.log('추이 응답 객체 키:', Object.keys(trendResponse));
      }

      // 응답 구조에 따라 데이터 추출
      let trendDataArray = [];

      if (Array.isArray(trendResponse)) {
        trendDataArray = trendResponse;
      } else if (typeof trendResponse === 'object' && trendResponse !== null) {
        if ('data' in trendResponse && Array.isArray(trendResponse.data)) {
          trendDataArray = trendResponse.data;
        } else if (Array.isArray(trendResponse.items)) {
          trendDataArray = trendResponse.items;
        }
      }

      console.log('추출된 추이 데이터:', trendDataArray);

      // 데이터 포맷팅
      const formattedData = trendDataArray.map((item: any) => {
        try {
          if (!item.date) return { date: '-', 가입자수: item.count || 0 };

          const date = new Date(item.date);
          if (isNaN(date.getTime())) {
            return { date: item.date, 가입자수: item.count || 0 };
          }

          return {
            date: format(date, 'MM/dd'),
            가입자수: item.count || 0
          };
        } catch (e) {
          console.error('날짜 변환 오류:', e, item);
          return { date: item.date || '-', 가입자수: item.count || 0 };
        }
      });

      setTrendData(formattedData);
    } catch (error: any) {
      console.error('사용자 지정 기간 데이터 조회 중 오류:', error);

      // 인증 오류 처리
      if (error.response?.status === 401) {
        setError('인증이 만료되었습니다. 다시 로그인해주세요.');
      } else {
        setError(
          error.response?.data?.message ||
          error.message ||
          '데이터를 불러오는데 실패했습니다.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // 인증 상태 확인
  const checkAuthStatus = () => {
    const token = localStorage.getItem('accessToken');
    const isAdmin = localStorage.getItem('isAdmin');

    if (!token || isAdmin !== 'true') {
      setError('관리자 권한이 필요합니다. 다시 로그인해주세요.');
      return false;
    }

    return true;
  };

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    // 인증 상태 확인
    if (!checkAuthStatus()) return;

    // 시작일과 종료일이 유효한 경우에만 데이터 로드
    if (startDate && endDate && isDateRangeValid()) {
      fetchData();
    }
  }, []);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          기간별 회원가입 통계
        </Typography>

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={5}>
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true, size: 'small' } }}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                variant="contained"
                onClick={fetchData}
                disabled={loading || !isDateRangeValid()}
                fullWidth
                sx={{ height: '40px' }}
              >
                {loading ? <CircularProgress size={24} /> : '조회'}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>

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

        {!loading && (
          <Paper elevation={2} sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
            <Typography variant="h5" align="center">
              선택 기간 내 총 회원가입자 수: <strong id="signup-count">{`${signupCount}명`}</strong>
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
              {startDate && endDate ? `${format(startDate, 'yyyy년 MM월 dd일')} ~ ${format(endDate, 'yyyy년 MM월 dd일')}` : ''}
            </Typography>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Typography variant="caption" color="textSecondary">
                데이터 로그: {JSON.stringify({ signupCount })}
              </Typography>
            </Box>
          </Paper>
        )}

        {!loading && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              일별 회원가입 추이
            </Typography>
            {trendData.length > 0 ? (
              <Box sx={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      interval={Math.max(1, Math.floor(trendData.length / 10))}
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="가입자수"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center', bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography color="textSecondary">
                  선택한 기간에 대한 데이터가 없습니다.
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
