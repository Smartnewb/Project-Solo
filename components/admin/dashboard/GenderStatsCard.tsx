"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Skeleton,
  LinearProgress,
  linearProgressClasses,
  styled,
} from "@mui/material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import AdminService from "@/app/services/admin";

interface GenderStats {
  maleCount: number;
  femaleCount: number;
  totalCount: number;
  malePercentage: number;
  femalePercentage: number;
  genderRatio: string;
}

interface GenderStatsCardProps {
  region?: string;
  includeDeleted?: boolean;
  useCluster?: boolean;
}

const MALE_COLOR = "#3b82f6";
const FEMALE_COLOR = "#ec4899";

const MaleProgress = styled(LinearProgress)(() => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "#e0e7ff",
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: MALE_COLOR,
  },
}));

const FemaleProgress = styled(LinearProgress)(() => ({
  height: 10,
  borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: "#fce7f3",
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: FEMALE_COLOR,
  },
}));

function MaleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="10"
        cy="14"
        r="5"
        stroke={MALE_COLOR}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M14 10L20 4M20 4H15M20 4V9"
        stroke={MALE_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function FemaleIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="9"
        r="5"
        stroke={FEMALE_COLOR}
        strokeWidth="2"
        fill="none"
      />
      <path
        d="M12 14V21M9 18H15"
        stroke={FEMALE_COLOR}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <Box className="flex flex-col md:flex-row gap-8 p-6">
      <Box
        className="flex-shrink-0 flex items-center justify-center"
        sx={{ width: { xs: "100%", md: 200 }, height: 200 }}
      >
        <Skeleton variant="circular" width={180} height={180} />
      </Box>
      <Box className="flex-1 flex flex-col gap-6">
        <Box className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50">
          <Skeleton variant="text" width={120} height={32} />
        </Box>
        <Box className="flex flex-col gap-4">
          <Box className="p-4 rounded-xl bg-blue-50/50">
            <Box className="flex justify-between mb-2">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={60} />
            </Box>
            <Skeleton variant="rounded" height={10} />
          </Box>
          <Box className="p-4 rounded-xl bg-pink-50/50">
            <Box className="flex justify-between mb-2">
              <Skeleton variant="text" width={80} />
              <Skeleton variant="text" width={60} />
            </Box>
            <Skeleton variant="rounded" height={10} />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Box className="flex flex-col items-center justify-center py-12 px-6">
      <Box className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2" />
          <path
            d="M12 8V12M12 16H12.01"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </Box>
      <Typography className="text-slate-600 text-center font-medium">
        {message}
      </Typography>
      <Typography className="text-slate-400 text-sm mt-1">
        잠시 후 다시 시도해주세요
      </Typography>
    </Box>
  );
}

export default function GenderStatsCard({
  region,
  includeDeleted = false,
  useCluster = true,
}: GenderStatsCardProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<GenderStats | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await AdminService.stats.getGenderStats(
          region,
          includeDeleted,
          useCluster,
        );
        console.log("성별 통계 응답:", response);

        setStats(response);
      } catch (error: any) {
        console.error("성별 통계 조회 중 오류:", error);
        setError(
          error.response?.data?.message ||
            error.message ||
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
    return <ErrorState message={error} />;
  }

  if (!stats) {
    return <ErrorState message="데이터가 없습니다" />;
  }

  const chartData = [
    { name: "남성", value: stats.maleCount, color: MALE_COLOR },
    { name: "여성", value: stats.femaleCount, color: FEMALE_COLOR },
  ];

  return (
    <Box className="flex flex-col lg:flex-row gap-6 p-6">
      <Box
        className="flex-shrink-0 relative"
        sx={{ width: { xs: "100%", lg: 220 }, height: 220 }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={65}
              outerRadius={95}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))" }}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        <Box className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <Typography className="text-slate-400 text-xs font-medium tracking-wide uppercase">
            Total
          </Typography>
          <Typography
            className="font-bold text-slate-800"
            sx={{ fontSize: "1.75rem", lineHeight: 1.2 }}
          >
            {stats.totalCount.toLocaleString()}
          </Typography>
          <Typography className="text-slate-400 text-xs">명</Typography>
        </Box>
      </Box>

      <Box className="flex-1 flex flex-col gap-5">
        <Box
          className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl"
          sx={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <Box className="flex items-center gap-1.5">
            <Box
              className="w-3 h-3 rounded-full"
              sx={{ backgroundColor: MALE_COLOR }}
            />
            <Typography className="font-semibold text-slate-700">
              {stats.genderRatio.split(":")[0]}
            </Typography>
          </Box>
          <Typography className="text-slate-300 font-light text-lg">
            :
          </Typography>
          <Box className="flex items-center gap-1.5">
            <Typography className="font-semibold text-slate-700">
              {stats.genderRatio.split(":")[1]}
            </Typography>
            <Box
              className="w-3 h-3 rounded-full"
              sx={{ backgroundColor: FEMALE_COLOR }}
            />
          </Box>
        </Box>

        <Box className="flex flex-col gap-4">
          <Box
            className="p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
            sx={{
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              border: "1px solid #bfdbfe",
            }}
          >
            <Box className="flex items-center justify-between mb-3">
              <Box className="flex items-center gap-2">
                <Box
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  sx={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                >
                  <MaleIcon />
                </Box>
                <Typography className="font-semibold text-slate-700">
                  남성
                </Typography>
              </Box>
              <Box className="flex items-baseline gap-1">
                <Typography
                  className="font-bold"
                  sx={{ color: MALE_COLOR, fontSize: "1.25rem" }}
                >
                  {stats.maleCount.toLocaleString()}
                </Typography>
                <Typography className="text-slate-500 text-sm">명</Typography>
              </Box>
            </Box>
            <Box className="flex items-center gap-3">
              <Box className="flex-1">
                <MaleProgress
                  variant="determinate"
                  value={stats.malePercentage}
                />
              </Box>
              <Typography
                className="font-semibold text-sm min-w-[48px] text-right"
                sx={{ color: MALE_COLOR }}
              >
                {stats.malePercentage.toFixed(1)}%
              </Typography>
            </Box>
          </Box>

          <Box
            className="p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
            sx={{
              background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
              border: "1px solid #fbcfe8",
            }}
          >
            <Box className="flex items-center justify-between mb-3">
              <Box className="flex items-center gap-2">
                <Box
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  sx={{ backgroundColor: "rgba(236, 72, 153, 0.15)" }}
                >
                  <FemaleIcon />
                </Box>
                <Typography className="font-semibold text-slate-700">
                  여성
                </Typography>
              </Box>
              <Box className="flex items-baseline gap-1">
                <Typography
                  className="font-bold"
                  sx={{ color: FEMALE_COLOR, fontSize: "1.25rem" }}
                >
                  {stats.femaleCount.toLocaleString()}
                </Typography>
                <Typography className="text-slate-500 text-sm">명</Typography>
              </Box>
            </Box>
            <Box className="flex items-center gap-3">
              <Box className="flex-1">
                <FemaleProgress
                  variant="determinate"
                  value={stats.femalePercentage}
                />
              </Box>
              <Typography
                className="font-semibold text-sm min-w-[48px] text-right"
                sx={{ color: FEMALE_COLOR }}
              >
                {stats.femalePercentage.toFixed(1)}%
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
