"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Button,
  Chip,
  Divider,
  Grid,
} from "@mui/material";
import {
  ArrowForward as ArrowForwardIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from "@mui/icons-material";
import { KPI, ExtendedRevenueResponse } from "../types";
import { dashboardService } from "@/app/services/dashboard";

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

const getDayName = () => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return days[new Date().getDay()] + "요일";
};

interface MetricItemProps {
  label: string;
  value: number;
  comparison?: number;
  comparisonLabel?: string;
  isMain?: boolean;
}

function MetricItem({
  label,
  value,
  comparison,
  comparisonLabel,
  isMain,
}: MetricItemProps) {
  const isPositive = comparison !== undefined && comparison >= 0;

  return (
    <Box>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ fontSize: isMain ? "0.875rem" : "0.75rem" }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
        <Typography
          fontWeight={isMain ? 700 : 600}
          sx={{
            color: isMain ? "#059669" : "text.primary",
            fontSize: isMain ? "1.75rem" : "1rem",
          }}
        >
          ₩{formatCurrency(value)}
        </Typography>
        {comparison !== undefined && (
          <Chip
            size="small"
            icon={
              isPositive ? (
                <TrendingUpIcon sx={{ fontSize: 14 }} />
              ) : (
                <TrendingDownIcon sx={{ fontSize: 14 }} />
              )
            }
            label={`${isPositive ? "+" : ""}${comparison}%`}
            sx={{
              height: 20,
              fontSize: "0.7rem",
              backgroundColor: isPositive ? "#dcfce7" : "#fee2e2",
              color: isPositive ? "#166534" : "#991b1b",
              "& .MuiChip-icon": {
                color: isPositive ? "#166534" : "#991b1b",
              },
            }}
          />
        )}
      </Box>
      {comparisonLabel && (
        <Typography variant="caption" color="text.secondary">
          {comparisonLabel}
        </Typography>
      )}
    </Box>
  );
}

export default function RevenueOverview({
  kpi,
  loading,
}: RevenueOverviewProps) {
  const [extendedRevenue, setExtendedRevenue] =
    useState<ExtendedRevenueResponse | null>(null);
  const [extendedLoading, setExtendedLoading] = useState(true);
  const [extendedError, setExtendedError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExtendedRevenue = async () => {
      try {
        setExtendedLoading(true);
        setExtendedError(null);
        const data = await dashboardService.getExtendedRevenue();
        setExtendedRevenue(data);
      } catch (error) {
        console.error("확장 매출 현황 조회 실패:", error);
        setExtendedError("매출 현황 데이터를 불러오는데 실패했습니다.");
      } finally {
        setExtendedLoading(false);
      }
    };

    fetchExtendedRevenue();
  }, []);

  const revenue = extendedRevenue?.revenue;
  const isLoading = loading || extendedLoading;

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

        {extendedError && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {extendedError}
          </Alert>
        )}

        {isLoading ? (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Skeleton
              variant="rectangular"
              height={80}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              height={60}
              sx={{ borderRadius: 2 }}
            />
            <Skeleton
              variant="rectangular"
              height={60}
              sx={{ borderRadius: 2 }}
            />
          </Box>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: "#ecfdf5" }}>
              <MetricItem
                label="이번 달 매출"
                value={revenue?.thisMonth ?? kpi?.monthlyRevenue ?? 0}
                comparison={revenue?.monthOverMonthChange}
                comparisonLabel={`저번달: ₩${formatCurrency(revenue?.lastMonth ?? 0)}`}
                isMain
              />
            </Box>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Box
                  sx={{ p: 1.5, borderRadius: 1, backgroundColor: "#f0f9ff" }}
                >
                  <MetricItem
                    label="이번 주"
                    value={revenue?.thisWeek ?? 0}
                    comparison={revenue?.weekOverWeekChange}
                    comparisonLabel={`저번주: ₩${formatCurrency(revenue?.lastWeek ?? 0)}`}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Box
                  sx={{ p: 1.5, borderRadius: 1, backgroundColor: "#fefce8" }}
                >
                  <MetricItem
                    label="오늘"
                    value={revenue?.today ?? 0}
                    comparison={revenue?.sameDayChange}
                    comparisonLabel={`지난주 ${getDayName()}: ₩${formatCurrency(revenue?.lastWeekSameDay ?? 0)}`}
                  />
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ p: 1.5, borderRadius: 1, backgroundColor: "#f5f5f5" }}>
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
              >
                평균 매출
              </Typography>
              <Grid container spacing={1} sx={{ mt: 0.5 }}>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    월간
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₩{formatCurrency(revenue?.monthlyAverage ?? 0)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    주간
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₩{formatCurrency(revenue?.weeklyAverage ?? 0)}
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">
                    일간
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ₩{formatCurrency(revenue?.dailyAverage ?? 0)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
