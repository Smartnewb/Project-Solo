"use client";
import { Skeleton } from "@heroui/react";

import { useState, useEffect } from "react";

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
    <div className="flex flex-col md:flex-row gap-8 p-6">
      <div
        className="flex-shrink-0 flex items-center justify-center"
        style={{ width: 200, height: 200 }}
      >
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-slate-50">
          <Skeleton className="h-6 w-full rounded-lg" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-[#f7f7f7]">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
            <Skeleton className="h-6 w-full rounded-lg" />
          </div>
          <div className="p-4 rounded-xl bg-pink-50/50">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-6 w-full rounded-lg" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
            <Skeleton className="h-6 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
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
      </div>
      <div className={"text-sm text-neutral-700"}>{message}</div>
      <div className={"text-sm text-neutral-700"}>
        잠시 후 다시 시도해주세요
      </div>
    </div>
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
    <div className="flex flex-col lg:flex-row gap-6 p-6">
      <div
        className="flex-shrink-0 relative"
        style={{ width: "100%", height: 220 }}
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
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className={"text-sm text-neutral-700"}>Total</div>
          <div
            style={{ fontSize: "1.75rem", lineHeight: 1.2 }}
            className={"text-sm text-neutral-700"}
          >
            {stats.totalCount.toLocaleString()}
          </div>
          <div className={"text-sm text-neutral-700"}>명</div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-5">
        <div
          className="flex items-center justify-center gap-3 py-3 px-5 rounded-2xl"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: MALE_COLOR }}
            ></div>
            <div className={"text-sm text-neutral-700"}>
              {(stats.genderRatio || "0:0").split(":")[0]}
            </div>
          </div>
          <div className={"text-sm text-neutral-700"}>:</div>
          <div className="flex items-center gap-1.5">
            <div className={"text-sm text-neutral-700"}>
              {(stats.genderRatio || "0:0").split(":")[1]}
            </div>
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: FEMALE_COLOR }}
            ></div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div
            className="p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)",
              border: "1px solid #bfdbfe",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                >
                  <MaleIcon />
                </div>
                <div className={"text-sm text-neutral-700"}>남성</div>
              </div>
              <div className="flex items-baseline gap-1">
                <div
                  style={{ color: MALE_COLOR, fontSize: "1.25rem" }}
                  className={"text-sm text-neutral-700"}
                >
                  {stats.maleCount.toLocaleString()}
                </div>
                <div className={"text-sm text-neutral-700"}>명</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <progress
                  max={100}
                  value={stats.malePercentage}
                  className="h-2 w-full"
                />
              </div>
              <div
                style={{ color: MALE_COLOR }}
                className={"text-sm text-neutral-700"}
              >
                {stats.malePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
          <div
            className="p-4 rounded-2xl transition-all duration-200 hover:shadow-md"
            style={{
              background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)",
              border: "1px solid #fbcfe8",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: "rgba(236, 72, 153, 0.15)" }}
                >
                  <FemaleIcon />
                </div>
                <div className={"text-sm text-neutral-700"}>여성</div>
              </div>
              <div className="flex items-baseline gap-1">
                <div
                  style={{ color: FEMALE_COLOR, fontSize: "1.25rem" }}
                  className={"text-sm text-neutral-700"}
                >
                  {stats.femaleCount.toLocaleString()}
                </div>
                <div className={"text-sm text-neutral-700"}>명</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <progress
                  max={100}
                  value={stats.femalePercentage}
                  className="h-2 w-full"
                />
              </div>
              <div
                style={{ color: FEMALE_COLOR }}
                className={"text-sm text-neutral-700"}
              >
                {stats.femalePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
