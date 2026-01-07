"use client";

import { useEffect, useState } from "react";
import { salesService } from "@/app/services/sales";
import {
  GemTriggerResponse,
  FeatureFunnelResponse,
  FirstPurchaseResponse,
  WhaleUserResponse,
  GemEconomyResponse,
  MatchingFunnelResponse,
} from "../types";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface InsightsTabProps {
  startDate?: Date;
  endDate?: Date;
}

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("ko-KR").format(num);
};

const formatPercent = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const PIE_COLORS = [
  "#7D4EE4",
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
];

const FUNNEL_COLORS = ["#7D4EE4", "#a78bfa", "#c4b5fd", "#e9d5ff"];

export function InsightsTab({ startDate, endDate }: InsightsTabProps) {
  const [gemTrigger, setGemTrigger] = useState<GemTriggerResponse | null>(null);
  const [featureFunnel, setFeatureFunnel] =
    useState<FeatureFunnelResponse | null>(null);
  const [firstPurchase, setFirstPurchase] =
    useState<FirstPurchaseResponse | null>(null);
  const [whaleUsers, setWhaleUsers] = useState<WhaleUserResponse | null>(null);
  const [gemEconomy, setGemEconomy] = useState<GemEconomyResponse | null>(null);
  const [matchingFunnel, setMatchingFunnel] =
    useState<MatchingFunnelResponse | null>(null);

  const [filterStartDate, setFilterStartDate] = useState<string>("");
  const [filterEndDate, setFilterEndDate] = useState<string>("");

  const [loadingGemTrigger, setLoadingGemTrigger] = useState(false);
  const [loadingFeatureFunnel, setLoadingFeatureFunnel] = useState(false);
  const [loadingFirstPurchase, setLoadingFirstPurchase] = useState(false);
  const [loadingWhaleUsers, setLoadingWhaleUsers] = useState(false);
  const [loadingGemEconomy, setLoadingGemEconomy] = useState(false);
  const [loadingMatchingFunnel, setLoadingMatchingFunnel] = useState(false);

  const [featureFunnelView, setFeatureFunnelView] = useState<
    "lastFeature" | "conversion"
  >("lastFeature");
  const [matchingFunnelView, setMatchingFunnelView] = useState<
    "funnel" | "trend"
  >("funnel");

  const getDateParams = () => {
    if (startDate && endDate) {
      return {
        startDate: formatDateToString(startDate),
        endDate: formatDateToString(endDate),
      };
    }
    if (filterStartDate && filterEndDate) {
      return {
        startDate: filterStartDate,
        endDate: filterEndDate,
      };
    }
    return undefined;
  };

  const fetchAllData = async () => {
    const params = getDateParams();

    setLoadingGemTrigger(true);
    setLoadingFeatureFunnel(true);
    setLoadingFirstPurchase(true);
    setLoadingWhaleUsers(true);
    setLoadingGemEconomy(true);
    setLoadingMatchingFunnel(true);

    try {
      const res = await salesService.getGemTrigger(params);
      setGemTrigger(res);
    } catch (e) {
      console.error("구슬 잔액 트리거 조회 실패:", e);
    } finally {
      setLoadingGemTrigger(false);
    }

    try {
      const res = await salesService.getFeatureFunnel(params);
      setFeatureFunnel(res);
    } catch (e) {
      console.error("기능→결제 퍼널 조회 실패:", e);
    } finally {
      setLoadingFeatureFunnel(false);
    }

    try {
      const res = await salesService.getFirstPurchase();
      setFirstPurchase(res);
    } catch (e) {
      console.error("첫 결제 트리거 조회 실패:", e);
    } finally {
      setLoadingFirstPurchase(false);
    }

    try {
      const res = await salesService.getWhaleUsers(params);
      setWhaleUsers(res);
    } catch (e) {
      console.error("고래 유저 분석 조회 실패:", e);
    } finally {
      setLoadingWhaleUsers(false);
    }

    try {
      const res = await salesService.getGemEconomy(params);
      setGemEconomy(res);
    } catch (e) {
      console.error("구슬 경제 밸런스 조회 실패:", e);
    } finally {
      setLoadingGemEconomy(false);
    }

    try {
      const res = await salesService.getMatchingFunnel(params);
      setMatchingFunnel(res);
    } catch (e) {
      console.error("매칭→수익화 퍼널 조회 실패:", e);
    } finally {
      setLoadingMatchingFunnel(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (startDate && endDate) {
      setFilterStartDate(formatDateToString(startDate));
      setFilterEndDate(formatDateToString(endDate));
    }
  }, [startDate, endDate]);

  const handleRefresh = () => {
    fetchAllData();
  };

  const handleQuickSelect = (days: number | null) => {
    if (days === null) {
      setFilterStartDate("");
      setFilterEndDate("");
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setFilterStartDate(formatDateToString(start));
      setFilterEndDate(formatDateToString(end));
    }
    setTimeout(() => fetchAllData(), 0);
  };

  const isAnyLoading =
    loadingGemTrigger ||
    loadingFeatureFunnel ||
    loadingFirstPurchase ||
    loadingWhaleUsers ||
    loadingGemEconomy ||
    loadingMatchingFunnel;

  const LoadingSkeleton = () => (
    <div className="animate-pulse bg-gray-200 rounded h-[200px]" />
  );

  const GemTriggerTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.balanceRange}</p>
          <p className="text-purple-600">
            구매건수: {formatNumber(data.purchaseCount)}건
          </p>
          <p className="text-gray-600">
            비율: {formatPercent(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  const FeatureFunnelTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.featureName}</p>
          <p className="text-purple-600">
            {featureFunnelView === "lastFeature"
              ? `구매건수: ${formatNumber(data.purchaseCount)}건`
              : `전환율: ${formatPercent(data.conversionRate)}`}
          </p>
          <p className="text-gray-600">
            비율: {formatPercent(data.percentage || data.conversionRate)}
          </p>
        </div>
      );
    }
    return null;
  };

  const FirstPurchaseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.days}일</p>
          <p className="text-purple-600">
            사용자수: {formatNumber(data.userCount)}명
          </p>
          <p className="text-gray-600">
            비율: {formatPercent(data.percentage)}
          </p>
        </div>
      );
    }
    return null;
  };

  const WhaleTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">상위 {data.percentile}%</p>
          <p className="text-purple-600">
            사용자수: {formatNumber(data.userCount)}명
          </p>
          <p className="text-blue-600">
            매출비중: {formatPercent(data.revenueShare)}
          </p>
          <p className="text-gray-600">
            인당 평균: {formatNumber(data.avgRevenuePerUser)}원
          </p>
        </div>
      );
    }
    return null;
  };

  const GemEconomyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {formatNumber(item.value)}개
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MatchingFunnelTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-purple-600">
            {formatNumber(payload[0].value)}
            {payload[0].name.includes("율") ? "%" : "건"}
          </p>
        </div>
      );
    }
    return null;
  };

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-50";
      case "inflation":
        return "text-orange-600 bg-orange-50";
      case "deflation":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case "healthy":
        return "건강";
      case "inflation":
        return "인플레이션";
      case "deflation":
        return "디플레이션";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">고급 인사이트</h2>
        <button
          onClick={handleRefresh}
          disabled={isAnyLoading}
          className="px-4 py-2 bg-[#7D4EE4] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          새로고침
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D4EE4] focus:border-transparent"
            />
            <span className="text-gray-400 text-sm">~</span>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D4EE4] focus:border-transparent"
            />
          </div>
          <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            <button
              onClick={() => handleQuickSelect(7)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStartDate ===
                formatDateToString(
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 7);
                    return d;
                  })(),
                )
                  ? "bg-[#7D4EE4] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              7일
            </button>
            <button
              onClick={() => handleQuickSelect(14)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStartDate ===
                formatDateToString(
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 14);
                    return d;
                  })(),
                )
                  ? "bg-[#7D4EE4] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              14일
            </button>
            <button
              onClick={() => handleQuickSelect(30)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStartDate ===
                formatDateToString(
                  (() => {
                    const d = new Date();
                    d.setDate(d.getDate() - 30);
                    return d;
                  })(),
                )
                  ? "bg-[#7D4EE4] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              30일
            </button>
            <button
              onClick={() => handleQuickSelect(null)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filterStartDate === "" && filterEndDate === ""
                  ? "bg-[#7D4EE4] text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              }`}
            >
              전체
            </button>
          </div>
          <button
            onClick={() => fetchAllData()}
            disabled={isAnyLoading}
            className="px-4 py-1.5 text-sm font-medium bg-[#7D4EE4] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            구슬 잔액 트리거
          </h3>
          {loadingGemTrigger ? (
            <LoadingSkeleton />
          ) : gemTrigger ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">평균 잔액</div>
                  <div className="text-lg font-bold text-purple-700">
                    {formatNumber(gemTrigger.averageBalance)}개
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">중앙값</div>
                  <div className="text-lg font-bold text-blue-700">
                    {formatNumber(gemTrigger.medianBalance)}개
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3">
                  <div className="text-xs text-green-600 mb-1">최빈값</div>
                  <div className="text-lg font-bold text-green-700">
                    {formatNumber(gemTrigger.modeBalance)}개
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="text-xs text-orange-600 mb-1">
                    권장 임계값
                  </div>
                  <div className="text-lg font-bold text-orange-700">
                    {formatNumber(gemTrigger.recommendedThreshold)}개
                  </div>
                </div>
              </div>
              {gemTrigger.distribution.length > 0 ? (
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={gemTrigger.distribution}
                      margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient
                          id="gemTriggerGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#7D4EE4"
                            stopOpacity={1}
                          />
                          <stop
                            offset="100%"
                            stopColor="#3b82f6"
                            stopOpacity={0.8}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="balanceRange"
                        tick={{ fontSize: 10 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<GemTriggerTooltip />} />
                      <Bar
                        dataKey="purchaseCount"
                        fill="url(#gemTriggerGradient)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  데이터 없음
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              기능 - 결제 퍼널
            </h3>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setFeatureFunnelView("lastFeature")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  featureFunnelView === "lastFeature"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                마지막 기능
              </button>
              <button
                onClick={() => setFeatureFunnelView("conversion")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  featureFunnelView === "conversion"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                전환율
              </button>
            </div>
          </div>
          {loadingFeatureFunnel ? (
            <LoadingSkeleton />
          ) : featureFunnel ? (
            <div className="h-[250px]">
              {featureFunnelView === "lastFeature" ? (
                featureFunnel.lastFeatureBeforePurchase.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={featureFunnel.lastFeatureBeforePurchase.slice(0, 5)}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="featureName"
                        type="category"
                        tick={{ fontSize: 11 }}
                        width={75}
                      />
                      <Tooltip content={<FeatureFunnelTooltip />} />
                      <Bar
                        dataKey="purchaseCount"
                        fill="#7D4EE4"
                        radius={[0, 4, 4, 0]}
                      >
                        {featureFunnel.lastFeatureBeforePurchase
                          .slice(0, 5)
                          .map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    데이터 없음
                  </div>
                )
              ) : featureFunnel.conversionByFeature.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureFunnel.conversionByFeature.slice(0, 5)}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <YAxis
                      dataKey="featureName"
                      type="category"
                      tick={{ fontSize: 11 }}
                      width={75}
                    />
                    <Tooltip content={<FeatureFunnelTooltip />} />
                    <Bar
                      dataKey="conversionRate"
                      fill="#22c55e"
                      radius={[0, 4, 4, 0]}
                    >
                      {featureFunnel.conversionByFeature
                        .slice(0, 5)
                        .map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  데이터 없음
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            첫 결제 트리거
          </h3>
          {loadingFirstPurchase ? (
            <LoadingSkeleton />
          ) : firstPurchase ? (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">
                    평균 첫 결제까지 소요일
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {firstPurchase.averageDays.toFixed(1)}일
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">중앙값</div>
                  <div className="text-lg font-bold text-blue-700">
                    {firstPurchase.medianDays}일
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    가입 후 첫 결제까지 일수 분포
                  </h4>
                  {firstPurchase.daysDistribution.length > 0 ? (
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={firstPurchase.daysDistribution}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="days"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => `${v}일`}
                          />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip content={<FirstPurchaseTooltip />} />
                          <Bar
                            dataKey="userCount"
                            fill="#7D4EE4"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터 없음
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    코호트별 전환율
                  </h4>
                  {firstPurchase.cohortConversion.length > 0 ? (
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={firstPurchase.cohortConversion}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="cohortWeek" tick={{ fontSize: 10 }} />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip />
                          <Line
                            type="monotone"
                            dataKey="conversionRate"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ fill: "#22c55e", r: 3 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            고래 유저 분석
          </h3>
          {loadingWhaleUsers ? (
            <LoadingSkeleton />
          ) : whaleUsers ? (
            <div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">
                    고래 유저 수
                  </div>
                  <div className="text-lg font-bold text-purple-700">
                    {formatNumber(whaleUsers.whaleCount)}명
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">
                    고래 기준 (상위 %)
                  </div>
                  <div className="text-lg font-bold text-blue-700">
                    {whaleUsers.whaleThreshold}%
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    매출 집중도 (파레토)
                  </h4>
                  {whaleUsers.revenueConcentration.length > 0 ? (
                    <div className="h-[160px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={whaleUsers.revenueConcentration}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="whaleAreaGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#7D4EE4"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="100%"
                                stopColor="#7D4EE4"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="percentile"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <YAxis
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip content={<WhaleTooltip />} />
                          <Area
                            type="monotone"
                            dataKey="revenueShare"
                            stroke="#7D4EE4"
                            fill="url(#whaleAreaGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터 없음
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    고래 유저 특성
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">남성 비율</span>
                      <span className="font-medium text-gray-900">
                        {formatPercent(
                          whaleUsers.whaleCharacteristics.malePercentage,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">여성 비율</span>
                      <span className="font-medium text-gray-900">
                        {formatPercent(
                          whaleUsers.whaleCharacteristics.femalePercentage,
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">평균 나이</span>
                      <span className="font-medium text-gray-900">
                        {whaleUsers.whaleCharacteristics.avgAge.toFixed(1)}세
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">평균 구매 횟수</span>
                      <span className="font-medium text-gray-900">
                        {whaleUsers.whaleCharacteristics.avgPurchaseCount.toFixed(
                          1,
                        )}
                        회
                      </span>
                    </div>
                    {whaleUsers.whaleCharacteristics.topFeatures.length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <span className="text-gray-500 text-xs">
                          주요 사용 기능
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {whaleUsers.whaleCharacteristics.topFeatures
                            .slice(0, 3)
                            .map((feature, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {feature}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            구슬 경제 밸런스
          </h3>
          {loadingGemEconomy ? (
            <LoadingSkeleton />
          ) : gemEconomy ? (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="text-xs text-purple-600 mb-1">총 충전량</div>
                  <div className="text-lg font-bold text-purple-700">
                    {formatNumber(gemEconomy.summary.totalCharged)}개
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-xs text-blue-600 mb-1">총 소비량</div>
                  <div className="text-lg font-bold text-blue-700">
                    {formatNumber(gemEconomy.summary.totalConsumed)}개
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-600 mb-1">전체 비율</div>
                  <div className="text-lg font-bold text-gray-700">
                    {(gemEconomy.summary.overallRatio * 100).toFixed(1)}%
                  </div>
                </div>
                <div
                  className={`rounded-lg p-3 ${getHealthStatusColor(gemEconomy.summary.healthStatus)}`}
                >
                  <div className="text-xs mb-1">상태</div>
                  <div className="text-lg font-bold">
                    {getHealthStatusText(gemEconomy.summary.healthStatus)}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    일별 충전/소비 추이
                  </h4>
                  {gemEconomy.dailyBalance.length > 0 ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={gemEconomy.dailyBalance}
                          margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                        >
                          <defs>
                            <linearGradient
                              id="chargedGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#7D4EE4"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="100%"
                                stopColor="#7D4EE4"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                            <linearGradient
                              id="consumedGradient"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="0%"
                                stopColor="#3b82f6"
                                stopOpacity={0.6}
                              />
                              <stop
                                offset="100%"
                                stopColor="#3b82f6"
                                stopOpacity={0.1}
                              />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip content={<GemEconomyTooltip />} />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="totalCharged"
                            name="충전량"
                            stroke="#7D4EE4"
                            fill="url(#chargedGradient)"
                          />
                          <Area
                            type="monotone"
                            dataKey="totalConsumed"
                            name="소비량"
                            stroke="#3b82f6"
                            fill="url(#consumedGradient)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터 없음
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    소스별 분포
                  </h4>
                  {gemEconomy.bySource.length > 0 ? (
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={gemEconomy.bySource.map((s) => ({
                              ...s,
                              name: s.sourceName,
                              value: s.charged + s.consumed,
                            }))}
                            cx="50%"
                            cy="50%"
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            labelLine={false}
                          >
                            {gemEconomy.bySource.map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={PIE_COLORS[index % PIE_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      데이터 없음
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              매칭 - 수익화 퍼널
            </h3>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setMatchingFunnelView("funnel")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  matchingFunnelView === "funnel"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                퍼널
              </button>
              <button
                onClick={() => setMatchingFunnelView("trend")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  matchingFunnelView === "trend"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                추이
              </button>
            </div>
          </div>
          {loadingMatchingFunnel ? (
            <LoadingSkeleton />
          ) : matchingFunnel ? (
            <div>
              {matchingFunnelView === "funnel" ? (
                <>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="bg-purple-100 rounded-lg p-2 text-center">
                      <div className="text-xs text-purple-600 mb-1">
                        좋아요 전환율
                      </div>
                      <div className="text-lg font-bold text-purple-700">
                        {formatPercent(matchingFunnel.funnel.likeRate)}
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-purple-600 mb-1">
                        채팅 전환율
                      </div>
                      <div className="text-lg font-bold text-purple-700">
                        {formatPercent(matchingFunnel.funnel.chatRate)}
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-blue-600 mb-1">
                        결제 전환율
                      </div>
                      <div className="text-lg font-bold text-blue-700">
                        {formatPercent(matchingFunnel.funnel.purchaseRate)}
                      </div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-green-600 mb-1">
                        전체 전환율
                      </div>
                      <div className="text-lg font-bold text-green-700">
                        {formatPercent(
                          matchingFunnel.funnel.overallConversionRate,
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          {
                            name: "전체 매칭",
                            value: matchingFunnel.funnel.totalMatches,
                          },
                          {
                            name: "좋아요",
                            value: matchingFunnel.funnel.matchesWithLike,
                          },
                          {
                            name: "채팅",
                            value: matchingFunnel.funnel.matchesWithChat,
                          },
                          {
                            name: "결제",
                            value: matchingFunnel.funnel.matchesWithPurchase,
                          },
                        ]}
                        margin={{ top: 10, right: 10, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip content={<MatchingFunnelTooltip />} />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                          {[0, 1, 2, 3].map((index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={FUNNEL_COLORS[index]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </>
              ) : matchingFunnel.conversionTrend.length > 0 ? (
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={matchingFunnel.conversionTrend}
                      margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `${v}%`}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="matchCount"
                        name="매칭 수"
                        stroke="#7D4EE4"
                        strokeWidth={2}
                        dot={{ fill: "#7D4EE4", r: 3 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="conversionRate"
                        name="전환율"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: "#22c55e", r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  데이터 없음
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>
      </div>
    </div>
  );
}
