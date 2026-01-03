'use client';

import { Card, CardContent, Typography, Box, Grid, Skeleton } from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
} from '@mui/icons-material';
import { KPI } from '../types';

interface KPICardsProps {
  kpi: KPI | null;
  loading?: boolean;
}

interface KPICardProps {
  title: string;
  dailyValue: number;
  dailyChange: number;
  weeklyValue: number;
  weeklyChange: number;
  formatter?: (value: number) => string;
  loading?: boolean;
  color: string;
}

const formatNumber = (value: number) => value.toLocaleString();
const formatCurrency = (value: number) => `${value.toLocaleString()}원`;

function TrendIndicator({ change }: { change: number }) {
  if (change > 0) {
    return (
      <Box className="flex items-center text-green-600">
        <TrendingUpIcon fontSize="small" />
        <Typography variant="caption" component="span" className="ml-0.5">
          +{change.toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  if (change < 0) {
    return (
      <Box className="flex items-center text-red-600">
        <TrendingDownIcon fontSize="small" />
        <Typography variant="caption" component="span" className="ml-0.5">
          {change.toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  return (
    <Box className="flex items-center text-gray-500">
      <TrendingFlatIcon fontSize="small" />
      <Typography variant="caption" component="span" className="ml-0.5">
        0%
      </Typography>
    </Box>
  );
}

function KPICard({ title, dailyValue, dailyChange, weeklyValue, weeklyChange, formatter = formatNumber, loading, color }: KPICardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color }}>
          {title}
        </Typography>

        {/* 오늘 */}
        <Box className="mb-3">
          <Typography variant="body2" color="textSecondary">
            오늘
          </Typography>
          <Box className="flex items-center justify-between">
            {loading ? (
              <Skeleton width={80} height={32} />
            ) : (
              <Typography variant="h5" fontWeight="bold">
                {formatter(dailyValue)}
              </Typography>
            )}
            {!loading && <TrendIndicator change={dailyChange} />}
          </Box>
        </Box>

        {/* 이번 주 */}
        <Box>
          <Typography variant="body2" color="textSecondary">
            이번 주
          </Typography>
          <Box className="flex items-center justify-between">
            {loading ? (
              <Skeleton width={80} height={32} />
            ) : (
              <Typography variant="h5" fontWeight="bold">
                {formatter(weeklyValue)}
              </Typography>
            )}
            {!loading && <TrendIndicator change={weeklyChange} />}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function KPICards({ kpi, loading }: KPICardsProps) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <KPICard
          title="가입자"
          dailyValue={kpi?.dailySignups?.value ?? 0}
          dailyChange={kpi?.dailySignups?.changePercent ?? 0}
          weeklyValue={kpi?.weeklySignups?.value ?? 0}
          weeklyChange={kpi?.weeklySignups?.changePercent ?? 0}
          formatter={formatNumber}
          loading={loading}
          color="#3B82F6"
        />
      </Grid>
      <Grid item xs={12} md={6}>
        <KPICard
          title="매출"
          dailyValue={kpi?.dailySales?.value ?? 0}
          dailyChange={kpi?.dailySales?.changePercent ?? 0}
          weeklyValue={kpi?.weeklySales?.value ?? 0}
          weeklyChange={kpi?.weeklySales?.changePercent ?? 0}
          formatter={formatCurrency}
          loading={loading}
          color="#10B981"
        />
      </Grid>
    </Grid>
  );
}
