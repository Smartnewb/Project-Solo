"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Grid,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PersonAdd as SignupIcon,
  PersonRemove as WithdrawalIcon,
  People as ActiveUsersIcon,
} from "@mui/icons-material";
import { KPI } from "../types";

interface TodayMetricsProps {
  kpi: KPI | null;
  loading?: boolean;
}

interface MetricItemProps {
  label: string;
  value: number;
  changePercent: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  formatter?: (value: number) => string;
  loading?: boolean;
  invertTrend?: boolean;
}

const formatNumber = (value: number) => value.toLocaleString();

function TrendBadge({
  change,
  invert = false,
}: {
  change: number;
  invert?: boolean;
}) {
  const isPositive = invert ? change < 0 : change > 0;
  const isNegative = invert ? change > 0 : change < 0;

  if (change === 0) {
    return (
      <Typography variant="caption" sx={{ color: "#6b7280" }}>
        ±0%
      </Typography>
    );
  }

  return (
    <Box
      className="flex items-center gap-0.5"
      sx={{
        color: isPositive ? "#16a34a" : isNegative ? "#dc2626" : "#6b7280",
      }}
    >
      {change > 0 ? (
        <TrendingUpIcon sx={{ fontSize: 14 }} />
      ) : (
        <TrendingDownIcon sx={{ fontSize: 14 }} />
      )}
      <Typography variant="caption" fontWeight={600}>
        {change > 0 ? "+" : ""}
        {change.toFixed(1)}%
      </Typography>
    </Box>
  );
}

function MetricItem({
  label,
  value,
  changePercent,
  icon,
  color,
  bgColor,
  formatter = formatNumber,
  loading,
  invertTrend = false,
}: MetricItemProps) {
  return (
    <Box className="flex items-center gap-3">
      <Box
        sx={{
          p: 1.5,
          borderRadius: 2,
          backgroundColor: bgColor,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {icon}
      </Box>
      <Box className="flex-1">
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        {loading ? (
          <Skeleton width={80} height={28} />
        ) : (
          <Box className="flex items-center gap-2">
            <Typography variant="h6" fontWeight={700} sx={{ color }}>
              {formatter(value)}
            </Typography>
            <TrendBadge change={changePercent} invert={invertTrend} />
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function TodayMetrics({ kpi, loading }: TodayMetricsProps) {
  return (
    <Card>
      <CardContent>
        <Box className="flex items-center gap-2 mb-4">
          <Typography variant="h6" fontWeight={600}>
            📊 오늘의 핵심 지표
          </Typography>
          <Typography variant="caption" color="text.secondary">
            전일 대비
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="오늘 가입"
              value={kpi?.dailySignups?.value ?? 0}
              changePercent={kpi?.dailySignups?.changePercent ?? 0}
              icon={<SignupIcon />}
              color="#3b82f6"
              bgColor="#eff6ff"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="오늘 탈퇴"
              value={kpi?.dailyWithdrawals?.value ?? 0}
              changePercent={kpi?.dailyWithdrawals?.changePercent ?? 0}
              icon={<WithdrawalIcon />}
              color="#ef4444"
              bgColor="#fef2f2"
              loading={loading}
              invertTrend
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="활성 사용자 (DAU)"
              value={kpi?.dau ?? 0}
              changePercent={0}
              icon={<ActiveUsersIcon />}
              color="#8b5cf6"
              bgColor="#f5f3ff"
              loading={loading}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
