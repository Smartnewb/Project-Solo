'use client';

import { Card, CardContent, Typography, Box, Skeleton, Divider } from '@mui/material';
import {
  People as PeopleIcon,
  CalendarToday as DailyIcon,
  DateRange as MonthlyIcon,
} from '@mui/icons-material';
import { KPI } from '../types';

interface UserMetricsCardProps {
  kpi: KPI | null;
  loading?: boolean;
}

interface MetricItemProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  loading?: boolean;
}

function MetricItem({ label, value, icon, loading }: MetricItemProps) {
  return (
    <Box className="flex items-center justify-between py-2">
      <Box className="flex items-center gap-2">
        <Box className="text-gray-400">{icon}</Box>
        <Typography variant="body2" color="textSecondary">
          {label}
        </Typography>
      </Box>
      {loading ? (
        <Skeleton width={60} height={24} />
      ) : (
        <Typography variant="h6" fontWeight="bold">
          {value.toLocaleString()}
          <Typography component="span" variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
            명
          </Typography>
        </Typography>
      )}
    </Box>
  );
}

export default function UserMetricsCard({ kpi, loading }: UserMetricsCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
          사용자 현황
        </Typography>

        <MetricItem
          label="DAU (일간 활성)"
          value={kpi?.dau ?? 0}
          icon={<DailyIcon fontSize="small" />}
          loading={loading}
        />

        <Divider />

        <MetricItem
          label="MAU (월간 활성)"
          value={kpi?.mau ?? 0}
          icon={<MonthlyIcon fontSize="small" />}
          loading={loading}
        />

        <Divider />

        <MetricItem
          label="총 사용자"
          value={kpi?.totalUsers ?? 0}
          icon={<PeopleIcon fontSize="small" />}
          loading={loading}
        />

        {/* DAU/MAU 비율 */}
        {!loading && kpi && kpi.mau > 0 && (
          <Box className="mt-3 pt-2 border-t border-gray-100">
            <Typography variant="caption" color="textSecondary">
              DAU/MAU 비율 (Stickiness)
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="secondary">
              {((kpi.dau / kpi.mau) * 100).toFixed(1)}%
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
