"use client";

import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
  Divider,
} from "@mui/material";
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { KPI } from "../types";

interface RevenueOverviewProps {
  kpi: KPI | null;
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1)}억`;
  }
  if (value >= 10000000) {
    return `${(value / 10000).toFixed(0)}만`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}만`;
  }
  return `${value.toLocaleString()}`;
};

function TrendBadge({ change }: { change: number }) {
  if (change === 0) {
    return (
      <Typography variant="caption" sx={{ color: "#6b7280" }}>
        ±0%
      </Typography>
    );
  }

  const isPositive = change > 0;

  return (
    <Box
      className="flex items-center gap-0.5"
      sx={{
        color: isPositive ? "#16a34a" : "#dc2626",
      }}
    >
      {isPositive ? (
        <TrendingUpIcon sx={{ fontSize: 16 }} />
      ) : (
        <TrendingDownIcon sx={{ fontSize: 16 }} />
      )}
      <Typography variant="body2" fontWeight={600}>
        {isPositive ? "+" : ""}
        {change.toFixed(1)}%
      </Typography>
    </Box>
  );
}

interface RevenueItemProps {
  label: string;
  value: number;
  changePercent?: number;
  loading?: boolean;
  highlight?: boolean;
}

function RevenueItem({
  label,
  value,
  changePercent,
  loading,
  highlight,
}: RevenueItemProps) {
  return (
    <Box className="flex items-center justify-between py-2">
      <Typography
        variant="body2"
        sx={{
          color: highlight ? "text.primary" : "text.secondary",
          fontWeight: highlight ? 600 : 400,
        }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton width={100} height={24} />
      ) : (
        <Box className="flex items-center gap-2">
          <Typography
            variant={highlight ? "h6" : "body1"}
            fontWeight={700}
            sx={{ color: "#10b981" }}
          >
            ₩{formatCurrency(value)}
          </Typography>
          {changePercent !== undefined && <TrendBadge change={changePercent} />}
        </Box>
      )}
    </Box>
  );
}

export default function RevenueOverview({
  kpi,
  loading,
}: RevenueOverviewProps) {
  const dailySales = kpi?.dailySales?.value ?? 0;
  const dailyChange = kpi?.dailySales?.changePercent ?? 0;
  const weeklySales = kpi?.weeklySales?.value ?? 0;
  const weeklyChange = kpi?.weeklySales?.changePercent ?? 0;

  return (
    <Card>
      <CardContent>
        <Box className="flex items-center justify-between mb-3">
          <Typography variant="h6" fontWeight={600}>
            💰 매출 현황
          </Typography>
          <Link href="/admin/sales" passHref>
            <Button
              size="small"
              endIcon={<ArrowForwardIcon />}
              sx={{ textTransform: "none" }}
            >
              상세 보기
            </Button>
          </Link>
        </Box>

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: "#ecfdf5",
            mb: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            오늘 매출
          </Typography>
          {loading ? (
            <Skeleton width={150} height={40} />
          ) : (
            <Box className="flex items-center gap-3">
              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ color: "#059669" }}
              >
                ₩{formatCurrency(dailySales)}
              </Typography>
              <TrendBadge change={dailyChange} />
            </Box>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        <RevenueItem
          label="이번 주"
          value={weeklySales}
          changePercent={weeklyChange}
          loading={loading}
        />
      </CardContent>
    </Card>
  );
}
