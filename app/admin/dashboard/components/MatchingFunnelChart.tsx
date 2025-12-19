'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Alert,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { dashboardService } from '@/app/services/dashboard';
import { MatchingFunnelResponse, FUNNEL_STAGE_LABELS } from '../types';

const COLORS = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF'];

interface ChartDataItem {
  stage: string;
  label: string;
  count: number;
  rate: number;
}

export default function MatchingFunnelChart() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<MatchingFunnelResponse | null>(null);

  // 기본값: 30일 전 ~ 오늘
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [startDate, setStartDate] = useState(thirtyDaysAgo.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dashboardService.getMatchingFunnel(startDate, endDate);
      setData(response);
    } catch (err) {
      console.error('매칭 퍼널 데이터 조회 실패:', err);
      setError('매칭 퍼널 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchData();
    }
  }, [startDate, endDate]);

  const chartData: ChartDataItem[] = data?.funnel.map((item) => ({
    stage: item.stage,
    label: FUNNEL_STAGE_LABELS[item.stage] || item.stage,
    count: item.count,
    rate: item.rate,
  })) ?? [];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ChartDataItem;
      return (
        <Box className="bg-white p-3 rounded shadow-lg border border-gray-200">
          <Typography variant="body2" fontWeight="bold">
            {item.label}
          </Typography>
          <Typography variant="body2">
            건수: {item.count.toLocaleString()}건
          </Typography>
          <Typography variant="body2">
            비율: {item.rate.toFixed(1)}%
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" fontWeight="bold">
            매칭 퍼널 분석
          </Typography>
          <Box className="flex gap-2">
            <TextField
              type="date"
              label="시작일"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              type="date"
              label="종료일"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </Box>

        {loading ? (
          <Box className="flex items-center justify-center h-80">
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : chartData.length === 0 ? (
          <Box className="flex items-center justify-center h-80">
            <Typography color="textSecondary">데이터가 없습니다.</Typography>
          </Box>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  width={90}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                  <LabelList
                    dataKey="rate"
                    position="right"
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    style={{ fontSize: 12, fill: '#666' }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* 단계별 전환율 */}
            {data?.conversionRates && (
              <Box className="mt-4 pt-4 border-t border-gray-200">
                <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                  단계별 전환율
                </Typography>
                <Box className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <ConversionRateItem
                    label="매칭→프로필확인"
                    rate={data.conversionRates.matchToView}
                  />
                  <ConversionRateItem
                    label="프로필→좋아요"
                    rate={data.conversionRates.viewToLike}
                  />
                  <ConversionRateItem
                    label="좋아요→양방향"
                    rate={data.conversionRates.likeToMutual}
                  />
                  <ConversionRateItem
                    label="양방향→채팅"
                    rate={data.conversionRates.mutualToChat}
                  />
                  <ConversionRateItem
                    label="채팅→활성채팅"
                    rate={data.conversionRates.chatToActive}
                  />
                </Box>
              </Box>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function ConversionRateItem({ label, rate }: { label: string; rate: number }) {
  const getColor = (r: number) => {
    if (r >= 70) return 'text-green-600';
    if (r >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Box className="bg-gray-50 rounded-lg p-2 text-center">
      <Typography variant="caption" color="textSecondary" className="block">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight="bold" className={getColor(rate)}>
        {rate.toFixed(1)}%
      </Typography>
    </Box>
  );
}
