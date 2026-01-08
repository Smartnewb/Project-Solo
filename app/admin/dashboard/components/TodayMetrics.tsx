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
  PersonAdd as SignupIcon,
  People as TotalUsersIcon,
  TrendingUp as MatchingIcon,
} from "@mui/icons-material";
import { KPI } from "../types";

interface TodayMetricsProps {
  kpi: KPI | null;
  loading?: boolean;
}

interface MetricItemProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  loading?: boolean;
  suffix?: string;
}

const formatNumber = (value: number) => value.toLocaleString();

function MetricItem({
  label,
  value,
  icon,
  color,
  bgColor,
  loading,
  suffix,
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
          <Typography variant="h6" fontWeight={700} sx={{ color }}>
            {typeof value === "number" ? formatNumber(value) : value}
            {suffix && (
              <Typography
                component="span"
                variant="body2"
                sx={{ color: "#6b7280", ml: 0.5 }}
              >
                {suffix}
              </Typography>
            )}
          </Typography>
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
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="오늘 가입"
              value={kpi?.dailySignups ?? 0}
              icon={<SignupIcon />}
              color="#3b82f6"
              bgColor="#eff6ff"
              loading={loading}
              suffix="명"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="총 회원 수"
              value={kpi?.totalUsers ?? 0}
              icon={<TotalUsersIcon />}
              color="#8b5cf6"
              bgColor="#f5f3ff"
              loading={loading}
              suffix="명"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <MetricItem
              label="매칭률"
              value={`${(kpi?.matchingRate ?? 0).toFixed(1)}`}
              icon={<MatchingIcon />}
              color="#10b981"
              bgColor="#ecfdf5"
              loading={loading}
              suffix="%"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
