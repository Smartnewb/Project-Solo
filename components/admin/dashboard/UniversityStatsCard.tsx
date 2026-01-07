"use client";

import { useState, useEffect } from "react";
import { Box, Alert, Skeleton } from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import AdminService from "@/app/services/admin";

const COLORS = {
  blue: "#3b82f6",
  pink: "#ec4899",
  amber: "#f59e0b",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  border: "#e5e7eb",
};

interface UniversityStatsCardProps {
  region?: string;
  includeDeleted?: boolean;
  useCluster?: boolean;
}

interface UniversityData {
  universityName: string;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  percentage: number;
  genderRatio: string;
}

interface StatsData {
  universities: UniversityData[];
  totalCount: number;
}

function LoadingSkeleton() {
  return (
    <Box className="p-6">
      <Box className="mb-8">
        <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
      </Box>
      <Box className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Box key={i} className="flex items-center gap-4">
            <Skeleton variant="text" width={120} height={24} />
            <Skeleton
              variant="rectangular"
              sx={{ flex: 1, borderRadius: 1 }}
              height={32}
            />
            <Skeleton variant="text" width={60} height={24} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function EmptyState() {
  return (
    <Box className="flex flex-col items-center justify-center py-16 px-6">
      <Box
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        sx={{ backgroundColor: "#fef3c7" }}
      >
        <svg
          className="w-8 h-8 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
          />
        </svg>
      </Box>
      <p className="text-gray-500 text-sm">대학별 통계 데이터가 없습니다.</p>
    </Box>
  );
}

function HorizontalBarChart({
  data,
  maxCount,
}: {
  data: UniversityData[];
  maxCount: number;
}) {
  const chartData = data.slice(0, 8).map((uni) => ({
    name: uni.universityName,
    male: uni.maleCount,
    female: uni.femaleCount,
    total: uni.totalCount,
  }));

  return (
    <Box className="mb-8" sx={{ height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 32, left: 8, bottom: 8 }}
          barCategoryGap="20%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke={COLORS.border}
          />
          <XAxis
            type="number"
            axisLine={false}
            tickLine={false}
            tick={{ fill: COLORS.gray, fontSize: 11 }}
            domain={[0, maxCount * 1.1]}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#374151", fontSize: 12, fontWeight: 500 }}
          />
          <RechartsTooltip
            contentStyle={{
              backgroundColor: "white",
              border: `1px solid ${COLORS.border}`,
              borderRadius: 8,
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              padding: "12px 16px",
            }}
            formatter={(value: number, name: string) => [
              `${value.toLocaleString()}명`,
              name === "male" ? "남성" : "여성",
            ]}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey="male"
            stackId="a"
            fill={COLORS.blue}
            radius={[0, 0, 0, 0]}
            name="male"
          />
          <Bar
            dataKey="female"
            stackId="a"
            fill={COLORS.pink}
            radius={[0, 4, 4, 0]}
            name="female"
          />
        </BarChart>
      </ResponsiveContainer>

      <Box className="flex items-center justify-center gap-6 mt-2">
        <Box className="flex items-center gap-2">
          <Box
            className="w-3 h-3 rounded-sm"
            sx={{ backgroundColor: COLORS.blue }}
          />
          <span className="text-xs text-gray-600">남성</span>
        </Box>
        <Box className="flex items-center gap-2">
          <Box
            className="w-3 h-3 rounded-sm"
            sx={{ backgroundColor: COLORS.pink }}
          />
          <span className="text-xs text-gray-600">여성</span>
        </Box>
      </Box>
    </Box>
  );
}

function StatsTable({
  data,
  totalCount,
}: {
  data: UniversityData[];
  totalCount: number;
}) {
  return (
    <Box
      className="overflow-hidden rounded-lg border"
      sx={{ borderColor: COLORS.border }}
    >
      <Box
        className="grid gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wider"
        sx={{
          gridTemplateColumns: "1fr 100px 1fr 80px",
          backgroundColor: COLORS.lightGray,
          color: COLORS.gray,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <span>대학교</span>
        <span className="text-right">회원수</span>
        <span className="text-center">성비</span>
        <span className="text-right">비율</span>
      </Box>

      <Box
        className="divide-y"
        sx={{ "& > div:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}
      >
        {data.map((uni, index) => {
          const malePercent =
            uni.totalCount > 0 ? (uni.maleCount / uni.totalCount) * 100 : 0;
          const femalePercent =
            uni.totalCount > 0 ? (uni.femaleCount / uni.totalCount) * 100 : 0;

          return (
            <Box
              key={index}
              className="grid gap-4 px-4 py-3 items-center transition-colors hover:bg-gray-50"
              sx={{
                gridTemplateColumns: "1fr 100px 1fr 80px",
                borderColor: COLORS.border,
              }}
            >
              <Box className="flex items-center gap-2">
                <Box
                  className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold"
                  sx={{
                    backgroundColor: index < 3 ? "#fef3c7" : COLORS.lightGray,
                    color: index < 3 ? COLORS.amber : COLORS.gray,
                  }}
                >
                  {index + 1}
                </Box>
                <span className="font-medium text-gray-900 text-sm truncate">
                  {uni.universityName}
                </span>
              </Box>

              <span className="text-right font-semibold text-gray-900 text-sm tabular-nums">
                {uni.totalCount.toLocaleString()}
              </span>

              <Box className="px-2">
                <Box
                  className="h-5 rounded-full overflow-hidden flex"
                  sx={{ backgroundColor: COLORS.lightGray }}
                >
                  <Box
                    className="h-full transition-all duration-300"
                    sx={{
                      width: `${malePercent}%`,
                      backgroundColor: COLORS.blue,
                    }}
                  />
                  <Box
                    className="h-full transition-all duration-300"
                    sx={{
                      width: `${femalePercent}%`,
                      backgroundColor: COLORS.pink,
                    }}
                  />
                </Box>
                <Box className="flex justify-between mt-1 text-[10px]">
                  <span style={{ color: COLORS.blue }}>{uni.maleCount}</span>
                  <span style={{ color: COLORS.pink }}>{uni.femaleCount}</span>
                </Box>
              </Box>

              <Box className="text-right">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor:
                      uni.percentage >= 10 ? "#ecfdf5" : COLORS.lightGray,
                    color: uni.percentage >= 10 ? "#059669" : COLORS.gray,
                  }}
                >
                  {uni.percentage.toFixed(1)}%
                </span>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box
        className="grid gap-4 px-4 py-3 items-center"
        sx={{
          gridTemplateColumns: "1fr 100px 1fr 80px",
          backgroundColor: "#f0fdf4",
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <span className="font-semibold text-gray-900">전체</span>
        <span className="text-right font-bold text-gray-900 tabular-nums">
          {totalCount.toLocaleString()}
        </span>
        <Box />
        <span className="text-right font-bold text-emerald-600">100%</span>
      </Box>
    </Box>
  );
}

export default function UniversityStatsCard({
  region,
  includeDeleted = false,
  useCluster = true,
}: UniversityStatsCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await AdminService.stats.getUniversityStats(
          region,
          includeDeleted,
          useCluster,
        );

        if (response && response.universities) {
          setStats(response);
        } else {
          setError("대학별 통계 데이터가 없습니다.");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "데이터를 불러오는데 실패했습니다.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [region, includeDeleted, useCluster]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Box className="p-6">
        <Alert
          severity="error"
          sx={{
            borderRadius: 2,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Box className="flex items-center justify-between w-full">
            <span>{error}</span>
            <button
              onClick={() => window.location.reload()}
              className="text-sm font-medium text-red-700 hover:text-red-800 underline"
            >
              다시 시도
            </button>
          </Box>
        </Alert>
      </Box>
    );
  }

  if (!stats || !stats.universities || stats.universities.length === 0) {
    return <EmptyState />;
  }

  const maxCount = Math.max(...stats.universities.map((u) => u.totalCount));

  return (
    <Box className="p-6">
      <HorizontalBarChart data={stats.universities} maxCount={maxCount} />
      <StatsTable data={stats.universities} totalCount={stats.totalCount} />
    </Box>
  );
}
