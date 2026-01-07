"use client";

import { useEffect, useState } from "react";
import { salesService } from "@/app/services/sales";
import {
  RevenueMetricsResponse,
  AverageOrderValueResponse,
  RepurchaseAnalysisResponse,
  ConversionRateResponse,
  LtvAnalysisResponse,
  RevenueMetricsTrendResponse,
} from "../types";
import { formatCurrency } from "../utils";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface RevenueMetricsTabProps {
  startDate?: Date;
  endDate?: Date;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(num);
};

const formatPercent = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function RevenueMetricsTab({
  startDate,
  endDate,
}: RevenueMetricsTabProps) {
  const [revenueMetrics, setRevenueMetrics] =
    useState<RevenueMetricsResponse | null>(null);
  const [aovData, setAovData] = useState<AverageOrderValueResponse | null>(
    null,
  );
  const [repurchaseData, setRepurchaseData] =
    useState<RepurchaseAnalysisResponse | null>(null);
  const [conversionData, setConversionData] =
    useState<ConversionRateResponse | null>(null);
  const [ltvData, setLtvData] = useState<LtvAnalysisResponse | null>(null);
  const [trendData, setTrendData] =
    useState<RevenueMetricsTrendResponse | null>(null);

  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingAov, setLoadingAov] = useState(false);
  const [loadingRepurchase, setLoadingRepurchase] = useState(false);
  const [loadingConversion, setLoadingConversion] = useState(false);
  const [loadingLtv, setLoadingLtv] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);

  const [error, setError] = useState<string>("");

  const getDateParams = () => {
    if (startDate && endDate) {
      return {
        startDate: formatDateToString(startDate),
        endDate: formatDateToString(endDate),
      };
    }
    return undefined;
  };

  const fetchAllData = async () => {
    setError("");
    const params = getDateParams();

    setLoadingMetrics(true);
    setLoadingAov(true);
    setLoadingRepurchase(true);
    setLoadingConversion(true);
    setLoadingLtv(true);
    setLoadingTrend(true);

    try {
      const metricsRes = await salesService.getRevenueMetrics(params);
      setRevenueMetrics(metricsRes);
    } catch (e) {
      console.error("수익 지표 조회 실패:", e);
    } finally {
      setLoadingMetrics(false);
    }

    try {
      const aovRes = await salesService.getAverageOrderValue(params);
      setAovData(aovRes);
    } catch (e) {
      console.error("평균 주문 금액 조회 실패:", e);
    } finally {
      setLoadingAov(false);
    }

    try {
      const repurchaseRes = await salesService.getRepurchaseAnalysis();
      setRepurchaseData(repurchaseRes);
    } catch (e) {
      console.error("재구매 분석 조회 실패:", e);
    } finally {
      setLoadingRepurchase(false);
    }

    try {
      const conversionRes = await salesService.getConversionRate(params);
      setConversionData(conversionRes);
    } catch (e) {
      console.error("결제 전환율 조회 실패:", e);
    } finally {
      setLoadingConversion(false);
    }

    try {
      const ltvRes = await salesService.getLtvAnalysis();
      setLtvData(ltvRes);
    } catch (e) {
      console.error("LTV 분석 조회 실패:", e);
    } finally {
      setLoadingLtv(false);
    }

    try {
      const trendRes = await salesService.getRevenueMetricsTrend({
        ...params,
        granularity: "monthly",
      });
      setTrendData(trendRes);
    } catch (e) {
      console.error("수익 지표 추이 조회 실패:", e);
    } finally {
      setLoadingTrend(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      fetchAllData();
    }
  }, [startDate, endDate]);

  const handleRefresh = () => {
    fetchAllData();
  };

  const MetricsTrendTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}:{" "}
              {item.name.includes("Rate") || item.name === "PUR"
                ? formatPercent(item.value)
                : formatCurrency(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const DistributionTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}회 구매</p>
          <p className="text-purple-600">
            사용자 수: {formatNumber(data.userCount)}명
          </p>
          <p className="text-gray-600">비율: {data.percentage.toFixed(1)}%</p>
        </div>
      );
    }
    return null;
  };

  const isAnyLoading =
    loadingMetrics ||
    loadingAov ||
    loadingRepurchase ||
    loadingConversion ||
    loadingLtv ||
    loadingTrend;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">수익 지표</h2>
        <button
          onClick={handleRefresh}
          disabled={isAnyLoading}
          className="px-4 py-2 bg-[#7D4EE4] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">ARPU</div>
          <div className="text-xs text-gray-400 mb-2">
            Average Revenue Per User
          </div>
          {loadingMetrics ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-bold text-purple-600">
                {revenueMetrics ? formatCurrency(revenueMetrics.arpu) : "-"}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                전체 사용자:{" "}
                {revenueMetrics ? formatNumber(revenueMetrics.totalUsers) : "-"}
                명
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">ARPPU</div>
          <div className="text-xs text-gray-400 mb-2">
            Average Revenue Per Paying User
          </div>
          {loadingMetrics ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-bold text-purple-600">
                {revenueMetrics ? formatCurrency(revenueMetrics.arppu) : "-"}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                유료 사용자:{" "}
                {revenueMetrics
                  ? formatNumber(revenueMetrics.payingUsers)
                  : "-"}
                명
              </div>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">PUR</div>
          <div className="text-xs text-gray-400 mb-2">Paying User Rate</div>
          {loadingMetrics ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-purple-600">
              {revenueMetrics
                ? formatPercent(revenueMetrics.payingUserRate)
                : "-"}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">AOV</div>
          <div className="text-xs text-gray-400 mb-2">Average Order Value</div>
          {loadingAov ? (
            <div className="h-8 bg-gray-100 rounded animate-pulse" />
          ) : (
            <>
              <div className="text-2xl font-bold text-purple-600">
                {aovData ? formatCurrency(aovData.aov) : "-"}
              </div>
              <div className="text-xs text-gray-400 mt-2">
                총 주문: {aovData ? formatNumber(aovData.totalOrders) : "-"}건
              </div>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          수익 지표 추이
        </h3>
        {loadingTrend ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : trendData && trendData.data.length > 0 ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData.data}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="amount"
                  orientation="left"
                  tickFormatter={(v) => formatCurrency(v)}
                  tick={{ fontSize: 12 }}
                  width={80}
                />
                <YAxis
                  yAxisId="rate"
                  orientation="right"
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fontSize: 12 }}
                  width={50}
                  domain={[0, 1]}
                />
                <Tooltip content={<MetricsTrendTooltip />} />
                <Legend />
                <Line
                  yAxisId="amount"
                  type="monotone"
                  dataKey="arpu"
                  stroke="#7D4EE4"
                  strokeWidth={2}
                  name="ARPU"
                  dot={{ fill: "#7D4EE4", r: 4 }}
                />
                <Line
                  yAxisId="amount"
                  type="monotone"
                  dataKey="arppu"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="ARPPU"
                  dot={{ fill: "#22c55e", r: 4 }}
                />
                <Line
                  yAxisId="rate"
                  type="monotone"
                  dataKey="payingUserRate"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="PUR"
                  dot={{ fill: "#f97316", r: 4 }}
                  strokeDasharray="5 5"
                />
                <Line
                  yAxisId="amount"
                  type="monotone"
                  dataKey="aov"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="AOV"
                  dot={{ fill: "#3b82f6", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            표시할 추이 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            결제 전환율
          </h3>
          {loadingConversion ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : conversionData ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-purple-50 rounded-lg">
                <div className="text-4xl font-bold text-purple-600">
                  {formatPercent(conversionData.conversionRate)}
                </div>
                <div className="text-sm text-gray-500 mt-1">전환율</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(conversionData.totalUsers)}명
                  </div>
                  <div className="text-xs text-gray-500">전체 사용자</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {formatNumber(conversionData.convertedUsers)}명
                  </div>
                  <div className="text-xs text-gray-500">결제 사용자</div>
                </div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  첫 결제까지 평균{" "}
                  <span className="font-semibold text-blue-600">
                    {conversionData.avgDaysToFirstPurchase.toFixed(1)}일
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            재구매 분석
          </h3>
          {loadingRepurchase ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : repurchaseData ? (
            <div className="space-y-4">
              <div className="text-center p-6 bg-green-50 rounded-lg">
                <div className="text-4xl font-bold text-green-600">
                  {formatPercent(repurchaseData.repeatPurchaseRate)}
                </div>
                <div className="text-sm text-gray-500 mt-1">재구매율</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatNumber(repurchaseData.totalPurchasers)}명
                  </div>
                  <div className="text-xs text-gray-500">전체 구매자</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {formatNumber(repurchaseData.repeatPurchasers)}명
                  </div>
                  <div className="text-xs text-gray-500">재구매자</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    평균 구매{" "}
                    <span className="font-semibold text-orange-600">
                      {repurchaseData.avgPurchaseCount.toFixed(1)}회
                    </span>
                  </div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-600">
                    구매 간격{" "}
                    <span className="font-semibold text-blue-600">
                      {repurchaseData.avgDaysBetweenPurchases.toFixed(1)}일
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          구매 횟수 분포
        </h3>
        {loadingRepurchase ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : repurchaseData &&
          repurchaseData.purchaseCountDistribution.length > 0 ? (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={repurchaseData.purchaseCountDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="purchaseCount"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v}회`}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${formatNumber(v)}명`}
                />
                <Tooltip content={<DistributionTooltip />} />
                <Bar
                  dataKey="userCount"
                  fill="#7D4EE4"
                  radius={[4, 4, 0, 0]}
                  name="사용자 수"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            표시할 분포 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">LTV 분석</h3>
        {loadingLtv ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : ltvData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">평균 LTV</div>
                <div className="text-xl font-bold text-purple-600">
                  {formatCurrency(ltvData.avgLtv)}
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">7일 LTV</div>
                <div className="text-xl font-bold text-blue-600">
                  {formatCurrency(ltvData.avgLtv7Days)}
                </div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">30일 LTV</div>
                <div className="text-xl font-bold text-green-600">
                  {formatCurrency(ltvData.avgLtv30Days)}
                </div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-sm text-gray-500 mb-1">90일 LTV</div>
                <div className="text-xl font-bold text-orange-600">
                  {formatCurrency(ltvData.avgLtv90Days)}
                </div>
              </div>
            </div>

            {ltvData.cohortData && ltvData.cohortData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        코호트
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자 수
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        7일 LTV
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        30일 LTV
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        90일 LTV
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {ltvData.cohortData.map((cohort, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {cohort.cohort}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                          {formatNumber(cohort.userCount)}명
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium">
                          {formatCurrency(cohort.ltv7Days)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                          {formatCurrency(cohort.ltv30Days)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600 font-medium">
                          {formatCurrency(cohort.ltv90Days)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            LTV 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
