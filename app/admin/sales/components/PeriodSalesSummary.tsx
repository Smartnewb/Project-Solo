"use client";

import { useState, useEffect } from "react";
import { salesService } from "@/app/services/sales";
import { WeeklySalesResponse, MonthlySalesResponse } from "../types";
import { formatCurrency } from "../utils";

interface PeriodSalesSummaryProps {
  startDate?: Date;
  endDate?: Date;
}

export function PeriodSalesSummary({
  startDate,
  endDate,
}: PeriodSalesSummaryProps) {
  const [weeklyData, setWeeklyData] = useState<WeeklySalesResponse | null>(
    null
  );
  const [monthlyData, setMonthlyData] = useState<MonthlySalesResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const formatDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchPeriodSales();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchPeriodSales();
    }
  }, [startDate, endDate]);

  const fetchPeriodSales = async () => {
    setIsLoading(true);
    setError("");

    try {
      const params =
        startDate && endDate
          ? {
              startDate: formatDateToString(startDate),
              endDate: formatDateToString(endDate),
            }
          : {};

      const [weeklyRes, monthlyRes] = await Promise.all([
        salesService.getSalesWeekly(params),
        salesService.getSalesMonthly(params),
      ]);

      setWeeklyData(weeklyRes);
      setMonthlyData(monthlyRes);
    } catch (err) {
      console.error("주간/월간 매출 조회 실패:", err);
      setError("주간/월간 매출 데이터를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPeriodSales();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p>{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-2 text-sm text-red-600 underline hover:text-red-800"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 이번 주 매출 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">이번 주 매출</h3>
          <button
            onClick={handleRefresh}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            새로고침
          </button>
        </div>
        <div className="text-2xl font-bold text-purple-600 mb-1">
          {weeklyData ? formatCurrency(weeklyData.weeklySales ?? 0) : "-"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          {weeklyData ? `${(weeklyData.weeklyCount ?? 0).toLocaleString()}건` : "-"}
        </div>

        {/* 예측치 표시 */}
        {weeklyData?.projectedWeeklySales !== undefined &&
          weeklyData?.elapsedDays !== undefined &&
          weeklyData?.remainingDays !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">예상:</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(weeklyData.projectedWeeklySales)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ({weeklyData.elapsedDays}/7일 경과, {weeklyData.remainingDays}일
                남음)
              </div>
              {weeklyData.projectedWeeklyCount !== undefined && (
                <div className="text-xs text-gray-400">
                  예상 건수: {weeklyData.projectedWeeklyCount.toLocaleString()}건
                </div>
              )}
            </div>
          )}
      </div>

      {/* 이번 달 매출 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-gray-500">이번 달 매출</h3>
        </div>
        <div className="text-2xl font-bold text-blue-600 mb-1">
          {monthlyData ? formatCurrency(monthlyData.monthlySales ?? 0) : "-"}
        </div>
        <div className="text-sm text-gray-500 mb-2">
          {monthlyData ? `${(monthlyData.monthlyCount ?? 0).toLocaleString()}건` : "-"}
        </div>

        {/* 예측치 표시 */}
        {monthlyData?.projectedMonthlySales !== undefined &&
          monthlyData?.elapsedDays !== undefined &&
          monthlyData?.totalDaysInMonth !== undefined && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">예상:</span>
                <span className="text-sm font-semibold text-orange-600">
                  {formatCurrency(monthlyData.projectedMonthlySales)}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                ({monthlyData.elapsedDays}/{monthlyData.totalDaysInMonth}일 경과
                {monthlyData.remainingDays !== undefined &&
                  `, ${monthlyData.remainingDays}일 남음`}
                )
              </div>
              {monthlyData.projectedMonthlyCount !== undefined && (
                <div className="text-xs text-gray-400">
                  예상 건수: {monthlyData.projectedMonthlyCount.toLocaleString()}
                  건
                </div>
              )}
            </div>
          )}
      </div>
    </div>
  );
}
