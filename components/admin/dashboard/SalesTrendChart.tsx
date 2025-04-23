'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Tab, Tabs, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko } from 'date-fns/locale';
import { format, subDays, subMonths } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import AdminService from '@/app/services/admin';

interface SalesTrendData {
  date?: string;
  week?: string;
  yearMonth?: string;
  startDate?: string;
  endDate?: string;
  sales: number;
  count: number;
}

export default function SalesTrendChart() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyData, setDailyData] = useState<SalesTrendData[]>([]);
  const [weeklyData, setWeeklyData] = useState<SalesTrendData[]>([]);
  const [monthlyData, setMonthlyData] = useState<SalesTrendData[]>([]);
  const [customData, setCustomData] = useState<SalesTrendData[]>([]);
  const [startDate, setStartDate] = useState<Date | null>(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState<Date | null>(new Date());
  const [periodType, setPeriodType] = useState<string>('daily');

  // 탭 변경 핸들러
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 기간 타입 변경 핸들러
  const handlePeriodTypeChange = (event: SelectChangeEvent) => {
    setPeriodType(event.target.value);
  };

  // 일별 매출 추이 조회
  const fetchDailyTrend = async () => {
    try {
      setLoading(true);
      const response = await AdminService.sales.getDailySalesTrend();
      if (response && response.data) {
        setDailyData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('일별 매출 추이 조회 중 오류:', err);
      setError('일별 매출 추이 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 주별 매출 추이 조회
  const fetchWeeklyTrend = async () => {
    try {
      setLoading(true);
      const response = await AdminService.sales.getWeeklySalesTrend();
      if (response && response.data) {
        setWeeklyData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('주별 매출 추이 조회 중 오류:', err);
      setError('주별 매출 추이 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 월별 매출 추이 조회
  const fetchMonthlyTrend = async () => {
    try {
      setLoading(true);
      const response = await AdminService.sales.getMonthlySalesTrend();
      if (response && response.data) {
        setMonthlyData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('월별 매출 추이 조회 중 오류:', err);
      setError('월별 매출 추이 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 사용자 지정 기간 매출 추이 조회
  const fetchCustomTrend = async () => {
    if (!startDate || !endDate) {
      setError('시작일과 종료일을 모두 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const formattedStartDate = format(startDate, 'yyyy-MM-dd');
      const formattedEndDate = format(endDate, 'yyyy-MM-dd');
      
      const response = await AdminService.sales.getCustomPeriodSalesTrend(
        formattedStartDate,
        formattedEndDate
      );
      
      if (response && response.data) {
        setCustomData(response.data);
      }
      setError(null);
    } catch (err) {
      console.error('사용자 지정 기간 매출 추이 조회 중 오류:', err);
      setError('사용자 지정 기간 매출 추이 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (tabValue === 0) {
      fetchDailyTrend();
    } else if (tabValue === 1) {
      fetchWeeklyTrend();
    } else if (tabValue === 2) {
      fetchMonthlyTrend();
    } else if (tabValue === 3) {
      fetchCustomTrend();
    }
  }, [tabValue]);

  // 사용자 지정 기간 변경 시 데이터 로드
  useEffect(() => {
    if (tabValue === 3 && startDate && endDate) {
      fetchCustomTrend();
    }
  }, [startDate, endDate, tabValue]);

  // 금액 포맷팅 함수
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
  };

  // 차트 데이터 준비
  const getChartData = () => {
    if (tabValue === 0) {
      return dailyData;
    } else if (tabValue === 1) {
      return weeklyData;
    } else if (tabValue === 2) {
      return monthlyData;
    } else {
      return customData;
    }
  };

  // X축 데이터 키 결정
  const getXAxisDataKey = () => {
    if (tabValue === 0) {
      return 'date';
    } else if (tabValue === 1) {
      return 'week';
    } else if (tabValue === 2) {
      return 'yearMonth';
    } else {
      return 'date';
    }
  };

  // 툴팁 포맷터
  const tooltipFormatter = (value: number, name: string) => {
    if (name === 'sales') {
      return [formatCurrency(value), '매출액'];
    }
    return [value, '건수'];
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ko}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" gutterBottom>
            매출 추이
          </Typography>

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{ mb: 3 }}
          >
            <Tab label="일별" />
            <Tab label="주별" />
            <Tab label="월별" />
            <Tab label="사용자 지정" />
          </Tabs>

          {tabValue === 3 && (
            <Box sx={{ mb: 3, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <FormControl fullWidth sx={{ maxWidth: { sm: 200 } }}>
                <InputLabel id="period-type-label">기간 단위</InputLabel>
                <Select
                  labelId="period-type-label"
                  value={periodType}
                  label="기간 단위"
                  onChange={handlePeriodTypeChange}
                >
                  <MenuItem value="daily">일별</MenuItem>
                  <MenuItem value="weekly">주별</MenuItem>
                  <MenuItem value="monthly">월별</MenuItem>
                </Select>
              </FormControl>
              
              <DatePicker
                label="시작일"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                sx={{ flex: 1 }}
              />
              
              <DatePicker
                label="종료일"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                sx={{ flex: 1 }}
              />
            </Box>
          )}

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="300px">
              <Typography color="error">{error}</Typography>
            </Box>
          ) : (
            <Box sx={{ height: 400, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getChartData()}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={getXAxisDataKey()} />
                  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip formatter={tooltipFormatter} />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    name="매출액"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="count"
                    name="건수"
                    stroke="#82ca9d"
                  />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </LocalizationProvider>
  );
}
