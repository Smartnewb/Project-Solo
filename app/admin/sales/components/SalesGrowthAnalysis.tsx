"use client";

import { useState, useEffect, useMemo } from "react";
import { salesService } from "@/app/services/sales";
import { TrendMonthlyResponse, SalesTransition } from "../types";
import { formatCurrency } from "../utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from "recharts";

interface SalesGrowthAnalysisProps {
  startDate?: Date;
  endDate?: Date;
}

interface MonthlyGrowthData {
  label: string;
  amount: number;
  count: number;
  momGrowthRate: number | null;
  yoyGrowthRate: number | null;
  movingAvg3M: number | null;
  movingAvg6M: number | null;
}

interface GrowthSummary {
  currentMonthAmount: number;
  lastMonthAmount: number;
  momGrowthRate: number | null;
  lastYearSameMonthAmount: number | null;
  yoyGrowthRate: number | null;
  avgMonthlyGrowth: number;
  avgMonthlyAmount: number;
  totalRevenue: number;
  bestMonth: { label: string; amount: number } | null;
  worstMonth: { label: string; amount: number } | null;
}

const formatPercent = (value: number | null): string => {
  if (value === null) return "-";
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const getGrowthColor = (value: number | null): string => {
  if (value === null) return "text-gray-400";
  if (value > 0) return "text-green-600";
  if (value < 0) return "text-red-600";
  return "text-gray-600";
};

const getGrowthBgColor = (value: number | null): string => {
  if (value === null) return "bg-gray-50";
  if (value > 10) return "bg-green-50";
  if (value > 0) return "bg-green-50/50";
  if (value < -10) return "bg-red-50";
  if (value < 0) return "bg-red-50/50";
  return "bg-gray-50";
};

export function SalesGrowthAnalysis({
  startDate,
  endDate,
}: SalesGrowthAnalysisProps) {
  const [monthlyData, setMonthlyData] = useState<SalesTransition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [selectedView, setSelectedView] = useState<"chart" | "table">("chart");

  useEffect(() => {
    fetchMonthlyTrend();
  }, []);

  const fetchMonthlyTrend = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await salesService.getTrendMonthly({
        paymentType: "all",
        byRegion: false,
      });

      if (response?.data) {
        setMonthlyData(response.data);
      }
    } catch (err) {
      console.error("월별 매출 추이 조회 실패:", err);
      setError("매출 추이 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const growthData = useMemo((): MonthlyGrowthData[] => {
    if (monthlyData.length === 0) return [];

    return monthlyData.map((item, index) => {
      const prevMonthAmount = index > 0 ? monthlyData[index - 1].amount : null;
      const sameMonthLastYear =
        index >= 12 ? monthlyData[index - 12].amount : null;

      const momGrowthRate =
        prevMonthAmount !== null && prevMonthAmount > 0
          ? ((item.amount - prevMonthAmount) / prevMonthAmount) * 100
          : null;

      const yoyGrowthRate =
        sameMonthLastYear !== null && sameMonthLastYear > 0
          ? ((item.amount - sameMonthLastYear) / sameMonthLastYear) * 100
          : null;

      const last3Months = monthlyData.slice(Math.max(0, index - 2), index + 1);
      const movingAvg3M =
        last3Months.length >= 3
          ? last3Months.reduce((sum, m) => sum + m.amount, 0) /
            last3Months.length
          : null;

      const last6Months = monthlyData.slice(Math.max(0, index - 5), index + 1);
      const movingAvg6M =
        last6Months.length >= 6
          ? last6Months.reduce((sum, m) => sum + m.amount, 0) /
            last6Months.length
          : null;

      return {
        label: item.label,
        amount: item.amount,
        count: item.count,
        momGrowthRate,
        yoyGrowthRate,
        movingAvg3M,
        movingAvg6M,
      };
    });
  }, [monthlyData]);

  const summary = useMemo((): GrowthSummary | null => {
    if (growthData.length < 2) return null;

    const currentMonth = growthData[growthData.length - 1];
    const lastMonth = growthData[growthData.length - 2];
    const lastYearSameMonth =
      growthData.length >= 13 ? growthData[growthData.length - 13] : null;

    const totalRevenue = growthData.reduce((sum, m) => sum + m.amount, 0);
    const avgMonthlyAmount = totalRevenue / growthData.length;

    const growthRates = growthData
      .filter((m) => m.momGrowthRate !== null)
      .map((m) => m.momGrowthRate as number);
    const avgMonthlyGrowth =
      growthRates.length > 0
        ? growthRates.reduce((sum, r) => sum + r, 0) / growthRates.length
        : 0;

    const SERVICE_START_DATE = "2025-05";
    const validData = growthData.filter(
      (item) => item.label >= SERVICE_START_DATE && item.amount > 0,
    );
    const sortedByAmount = [...validData].sort((a, b) => b.amount - a.amount);

    return {
      currentMonthAmount: currentMonth.amount,
      lastMonthAmount: lastMonth.amount,
      momGrowthRate: currentMonth.momGrowthRate,
      lastYearSameMonthAmount: lastYearSameMonth?.amount ?? null,
      yoyGrowthRate: currentMonth.yoyGrowthRate,
      avgMonthlyGrowth,
      avgMonthlyAmount,
      totalRevenue,
      bestMonth: sortedByAmount[0] || null,
      worstMonth: sortedByAmount[sortedByAmount.length - 1] || null,
    };
  }, [growthData]);

  const chartData = useMemo(() => {
    const SERVICE_START_DATE = "2025-05";
    const filteredData = growthData.filter(
      (item) => item.label >= SERVICE_START_DATE,
    );
    return filteredData.slice(-12).map((item) => ({
      ...item,
      momGrowthRate: item.momGrowthRate ?? 0,
      yoyGrowthRate: item.yoyGrowthRate ?? 0,
    }));
  }, [growthData]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload;
      return (
        <div className="bg-white p-4 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <p className="text-purple-600">매출: {formatCurrency(data.amount)}</p>
          <p className={getGrowthColor(data.momGrowthRate)}>
            MoM: {formatPercent(data.momGrowthRate)}
          </p>
          {data.yoyGrowthRate !== 0 && (
            <p className={getGrowthColor(data.yoyGrowthRate)}>
              YoY: {formatPercent(data.yoyGrowthRate)}
            </p>
          )}
          {data.movingAvg3M && (
            <p className="text-blue-500 text-sm mt-1">
              3개월 이평: {formatCurrency(data.movingAvg3M)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-gray-500">매출 성장 분석 로딩중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-500">{error}</p>
          <button
            onClick={fetchMonthlyTrend}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-lg border ${getGrowthBgColor(summary.momGrowthRate)}`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              전월 대비 (MoM)
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${getGrowthColor(summary.momGrowthRate)}`}
            >
              {formatPercent(summary.momGrowthRate)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {formatCurrency(summary.lastMonthAmount)} →{" "}
              {formatCurrency(summary.currentMonthAmount)}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg border ${getGrowthBgColor(summary.yoyGrowthRate)}`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              전년 동월 대비 (YoY)
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${getGrowthColor(summary.yoyGrowthRate)}`}
            >
              {formatPercent(summary.yoyGrowthRate)}
            </p>
            {summary.lastYearSameMonthAmount !== null && (
              <p className="text-xs text-gray-400 mt-1">
                작년: {formatCurrency(summary.lastYearSameMonthAmount)}
              </p>
            )}
          </div>

          <div className="p-4 rounded-lg border bg-purple-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              평균 월 성장률
            </p>
            <p
              className={`text-2xl font-bold mt-1 ${getGrowthColor(summary.avgMonthlyGrowth)}`}
            >
              {formatPercent(summary.avgMonthlyGrowth)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              월평균: {formatCurrency(summary.avgMonthlyAmount)}
            </p>
          </div>

          <div className="p-4 rounded-lg border bg-blue-50">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              누적 매출
            </p>
            <p className="text-2xl font-bold mt-1 text-blue-700">
              {formatCurrency(summary.totalRevenue)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {growthData.length}개월 기준
            </p>
          </div>
        </div>
      )}

      {summary?.bestMonth && summary?.worstMonth && (
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border border-green-200 bg-green-50/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <span className="text-sm font-medium text-green-800">
                최고 매출 월
              </span>
            </div>
            <p className="text-lg font-bold text-green-700 mt-2">
              {summary.bestMonth.label}
            </p>
            <p className="text-sm text-green-600">
              {formatCurrency(summary.bestMonth.amount)}
            </p>
          </div>
          <div className="p-4 rounded-lg border border-orange-200 bg-orange-50/50">
            <div className="flex items-center gap-2">
              <span className="text-lg">📉</span>
              <span className="text-sm font-medium text-orange-800">
                최저 매출 월
              </span>
            </div>
            <p className="text-lg font-bold text-orange-700 mt-2">
              {summary.worstMonth.label}
            </p>
            <p className="text-sm text-orange-600">
              {formatCurrency(summary.worstMonth.amount)}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setSelectedView("chart")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedView === "chart"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            차트
          </button>
          <button
            onClick={() => setSelectedView("table")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              selectedView === "table"
                ? "bg-white text-purple-700 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            테이블
          </button>
        </div>
      </div>

      {selectedView === "chart" && chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              월별 매출 및 이동평균
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(-5)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="매출"
                  stroke="#7D4EE4"
                  strokeWidth={2}
                  dot={{ fill: "#7D4EE4", strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="movingAvg3M"
                  name="3개월 이평"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-4">
              월별 성장률 (MoM)
            </h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(-5)}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${v}%`}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  formatter={(value: number) => [`${value.toFixed(1)}%`, "MoM"]}
                />
                <ReferenceLine y={0} stroke="#888" strokeDasharray="3 3" />
                <Bar dataKey="momGrowthRate" name="MoM 성장률">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.momGrowthRate >= 0 ? "#22C55E" : "#EF4444"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {selectedView === "table" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    월
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    매출
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    건수
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    MoM
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    YoY
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    3M 이평
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {growthData
                  .slice()
                  .reverse()
                  .slice(0, 24)
                  .map((item, index) => (
                    <tr
                      key={item.label}
                      className={index === 0 ? "bg-purple-50/50" : ""}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.label}
                        {index === 0 && (
                          <span className="ml-2 text-xs text-purple-600 font-normal">
                            (최신)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-600">
                        {item.count.toLocaleString()}건
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${getGrowthColor(item.momGrowthRate)}`}
                      >
                        {formatPercent(item.momGrowthRate)}
                      </td>
                      <td
                        className={`px-4 py-3 text-sm text-right font-medium ${getGrowthColor(item.yoyGrowthRate)}`}
                      >
                        {formatPercent(item.yoyGrowthRate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-blue-600">
                        {item.movingAvg3M
                          ? formatCurrency(item.movingAvg3M)
                          : "-"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
