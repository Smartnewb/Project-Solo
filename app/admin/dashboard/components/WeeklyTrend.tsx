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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { ArrowForward as ArrowForwardIcon } from "@mui/icons-material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import AdminService from "@/app/services/admin";
import { salesService } from "@/app/services/sales";

interface TrendData {
  date: string;
  value: number;
}

type MetricType = "signups" | "sales";

interface WeeklyTrendProps {
  compact?: boolean;
}

export default function WeeklyTrend({ compact = false }: WeeklyTrendProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<MetricType>("signups");
  const [signupData, setSignupData] = useState<TrendData[]>([]);
  const [salesData, setSalesData] = useState<TrendData[]>([]);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    try {
      setLoading(true);

      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);

      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };
      const startDate = formatDate(sevenDaysAgo);
      const endDate = formatDate(today);

      const [signupResponse, salesResponse] = await Promise.all([
        AdminService.stats
          .getCustomPeriodSignupTrend(startDate, endDate)
          .catch(() => ({ data: [] })),
        salesService
          .getTrendCustom({
            startDate,
            endDate,
            paymentType: "all",
            byRegion: false,
          })
          .catch(() => ({ data: [] })),
      ]);

      const processedSignups: TrendData[] = [];
      const processedSales: TrendData[] = [];

      for (let i = 0; i < 7; i++) {
        const date = new Date(sevenDaysAgo);
        date.setDate(sevenDaysAgo.getDate() + i);
        const dateStr = formatDate(date);
        const displayDate = `${date.getMonth() + 1}/${date.getDate()}`;

        const signupItem = signupResponse?.data?.find(
          (item: any) => item.date === dateStr,
        );
        processedSignups.push({
          date: displayDate,
          value: signupItem?.count ?? 0,
        });

        const salesItem = salesResponse?.data?.find(
          (item: any) => item.date === dateStr || item.label === dateStr,
        );
        processedSales.push({
          date: displayDate,
          value: salesItem?.amount ?? 0,
        });
      }

      setSignupData(processedSignups);
      setSalesData(processedSales);
    } catch (error) {
      setError("주간 트렌드 데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleMetricChange = (_: any, newMetric: MetricType | null) => {
    if (newMetric) {
      setMetric(newMetric);
    }
  };

  const currentData = metric === "signups" ? signupData : salesData;
  const chartColor = metric === "signups" ? "#3b82f6" : "#10b981";
  const chartBgColor = metric === "signups" ? "#eff6ff" : "#ecfdf5";

  const formatYAxis = (value: number) => {
    if (metric === "sales") {
      if (value >= 10000) {
        return `${(value / 10000).toFixed(0)}만`;
      }
      return (value ?? 0).toLocaleString();
    }
    return (value ?? 0).toString();
  };

  const formatTooltip = (value: number) => {
    if (metric === "sales") {
      return `₩${(value ?? 0).toLocaleString()}`;
    }
    return `${value ?? 0}명`;
  };

  return (
    <Card>
      <CardContent>
        <Box className="flex items-center justify-between mb-3">
          <Typography variant="h6" fontWeight={600}>
            📈 주간 트렌드
          </Typography>
          <Box className="flex items-center gap-2">
            <ToggleButtonGroup
              value={metric}
              exclusive
              onChange={handleMetricChange}
              size="small"
            >
              <ToggleButton value="signups" sx={{ px: 2, py: 0.5 }}>
                가입자
              </ToggleButton>
              <ToggleButton value="sales" sx={{ px: 2, py: 0.5 }}>
                매출
              </ToggleButton>
            </ToggleButtonGroup>
            <Link
              href={
                metric === "signups"
                  ? "/admin/dashboard/member-stats"
                  : "/admin/sales"
              }
              passHref
            >
              <Button
                size="small"
                endIcon={<ArrowForwardIcon />}
                sx={{ textTransform: "none" }}
              >
                상세
              </Button>
            </Link>
          </Box>
        </Box>

        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Skeleton
            variant="rectangular"
            height={compact ? 150 : 200}
            sx={{ borderRadius: 2 }}
          />
        ) : (
          <Box sx={{ width: "100%", height: compact ? 150 : 200 }}>
            <ResponsiveContainer>
              <AreaChart
                data={currentData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id={`gradient-${metric}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={chartColor}
                      stopOpacity={0.3}
                    />
                    <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={{ stroke: "#e5e7eb" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#6b7280" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={formatYAxis}
                  width={50}
                />
                <Tooltip
                  formatter={(value: number) => [
                    formatTooltip(value),
                    metric === "signups" ? "가입자" : "매출",
                  ]}
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={chartColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${metric})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
