"use client";

import { useEffect, useState } from "react";
import { salesService } from "@/app/services/sales";
import {
  ProductSalesResponse,
  ProductRankingResponse,
  PeriodAnalysisResponse,
  GemConsumptionResponse,
  SystemComparisonResponse,
  PricePeriod,
  PRICE_PERIOD_NAMES,
} from "../types";
import { formatCurrency } from "../utils";
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
} from "recharts";

interface ProductAnalysisTabProps {
  startDate?: Date;
  endDate?: Date;
}

type RankingTab = "count" | "revenue";
type SortColumn =
  | "productName"
  | "salesCount"
  | "totalRevenue"
  | "uniqueBuyers"
  | "gemAmount"
  | "pricePerGem"
  | "revenueShare";
type SortOrder = "asc" | "desc";

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

const getOneMonthAgo = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return formatDateToString(date);
};

const getToday = (): string => {
  return formatDateToString(new Date());
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

export function ProductAnalysisTab({
  startDate,
  endDate,
}: ProductAnalysisTabProps) {
  const [productSales, setProductSales] = useState<ProductSalesResponse | null>(
    null,
  );
  const [productRanking, setProductRanking] =
    useState<ProductRankingResponse | null>(null);
  const [periodAnalysis, setPeriodAnalysis] =
    useState<PeriodAnalysisResponse | null>(null);
  const [gemConsumption, setGemConsumption] =
    useState<GemConsumptionResponse | null>(null);
  const [systemComparison, setSystemComparison] =
    useState<SystemComparisonResponse | null>(null);

  const [filterStartDate, setFilterStartDate] =
    useState<string>(getOneMonthAgo());
  const [filterEndDate, setFilterEndDate] = useState<string>(getToday());
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");

  const [loadingProductSales, setLoadingProductSales] = useState(false);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [loadingPeriod, setLoadingPeriod] = useState(false);
  const [loadingGem, setLoadingGem] = useState(false);
  const [loadingSystem, setLoadingSystem] = useState(false);

  const [error, setError] = useState<string>("");

  const [bestSellerTab, setBestSellerTab] = useState<RankingTab>("count");
  const [worstSellerTab, setWorstSellerTab] = useState<RankingTab>("count");

  const [sortColumn, setSortColumn] = useState<SortColumn>("totalRevenue");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

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
    setError("");
    const params = getDateParams();
    const periodParams = selectedPeriod
      ? { ...params, pricePeriod: selectedPeriod }
      : params;

    setLoadingProductSales(true);
    setLoadingRanking(true);
    setLoadingPeriod(true);
    setLoadingGem(true);
    setLoadingSystem(true);

    try {
      const salesRes = await salesService.getProductSales(periodParams);
      setProductSales(salesRes);
    } catch (e) {
      console.error("상품별 판매 현황 조회 실패:", e);
    } finally {
      setLoadingProductSales(false);
    }

    try {
      const rankingRes = await salesService.getProductRanking(periodParams);
      setProductRanking(rankingRes);
    } catch (e) {
      console.error("상품 랭킹 조회 실패:", e);
    } finally {
      setLoadingRanking(false);
    }

    try {
      const periodRes = await salesService.getPeriodAnalysis();
      setPeriodAnalysis(periodRes);
    } catch (e) {
      console.error("기간별 분석 조회 실패:", e);
    } finally {
      setLoadingPeriod(false);
    }

    try {
      const gemRes = await salesService.getGemConsumption(params);
      setGemConsumption(gemRes);
    } catch (e) {
      console.error("구슬 소비 분석 조회 실패:", e);
    } finally {
      setLoadingGem(false);
    }

    try {
      const systemRes = await salesService.getSystemComparison();
      setSystemComparison(systemRes);
    } catch (e) {
      console.error("시스템 비교 조회 실패:", e);
    } finally {
      setLoadingSystem(false);
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

  const handleApplyFilter = () => {
    fetchAllData();
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortOrder("desc");
    }
  };

  const getSortedProducts = () => {
    if (!productSales?.products) return [];
    return [...productSales.products].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortOrder === "asc"
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });
  };

  const getAverageGemPrice = () => {
    if (!productSales?.products || productSales.products.length === 0) return 0;
    const totalGems = productSales.products.reduce(
      (sum, p) => sum + p.gemAmount * p.salesCount,
      0,
    );
    if (totalGems === 0) return 0;
    return productSales.totalRevenue / totalGems;
  };

  const isAnyLoading =
    loadingProductSales ||
    loadingRanking ||
    loadingPeriod ||
    loadingGem ||
    loadingSystem;

  const PeriodChartTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}:{" "}
              {item.name.includes("매출")
                ? formatCurrency(item.value)
                : formatNumber(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const GemConsumptionTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.featureName}</p>
          <p className="text-purple-600">
            소비량: {formatNumber(data.totalGemsConsumed)}개
          </p>
          <p className="text-gray-600">
            비율: {formatPercent(data.consumptionShare)}
          </p>
        </div>
      );
    }
    return null;
  };

  const HourlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-300 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}시</p>
          <p className="text-purple-600">
            사용횟수: {formatNumber(payload[0].value)}회
          </p>
          <p className="text-blue-600">
            소비량: {formatNumber(payload[1]?.value || 0)}개
          </p>
        </div>
      );
    }
    return null;
  };

  const renderSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortOrder === "desc" ? " ↓" : " ↑";
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">상품 분석</h2>
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
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7D4EE4] focus:border-transparent"
          >
            <option value="">전체 기간</option>
            {Object.entries(PRICE_PERIOD_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
          <button
            onClick={handleApplyFilter}
            disabled={isAnyLoading}
            className="px-4 py-1.5 text-sm font-medium bg-[#7D4EE4] text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            적용
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-purple-600 rounded-lg shadow-sm p-6">
          <div className="text-sm text-purple-100 mb-1">총 매출액</div>
          {loadingProductSales ? (
            <div className="h-8 bg-purple-500 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-white">
              {productSales ? formatCurrency(productSales.totalRevenue) : "-"}
            </div>
          )}
        </div>

        <div className="bg-blue-600 rounded-lg shadow-sm p-6">
          <div className="text-sm text-blue-100 mb-1">총 판매 건수</div>
          {loadingProductSales ? (
            <div className="h-8 bg-blue-500 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-white">
              {productSales
                ? `${formatNumber(productSales.totalSalesCount)}건`
                : "-"}
            </div>
          )}
        </div>

        <div className="bg-green-600 rounded-lg shadow-sm p-6">
          <div className="text-sm text-green-100 mb-1">총 구매자 수</div>
          {loadingProductSales ? (
            <div className="h-8 bg-green-500 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-white">
              {productSales
                ? `${formatNumber(productSales.totalUniqueBuyers)}명`
                : "-"}
            </div>
          )}
        </div>

        <div className="bg-orange-500 rounded-lg shadow-sm p-6">
          <div className="text-sm text-orange-100 mb-1">평균 구슬당 단가</div>
          {loadingProductSales ? (
            <div className="h-8 bg-orange-400 rounded animate-pulse" />
          ) : (
            <div className="text-2xl font-bold text-white">
              {productSales ? formatCurrency(getAverageGemPrice()) : "-"}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            상품별 판매 현황
          </h3>
        </div>
        {loadingProductSales ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : productSales && productSales.products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("productName")}
                  >
                    상품명{renderSortIcon("productName")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("salesCount")}
                  >
                    판매량{renderSortIcon("salesCount")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    매출액{renderSortIcon("totalRevenue")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("uniqueBuyers")}
                  >
                    구매자수{renderSortIcon("uniqueBuyers")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("gemAmount")}
                  >
                    지급구슬{renderSortIcon("gemAmount")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("pricePerGem")}
                  >
                    구슬당단가{renderSortIcon("pricePerGem")}
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-purple-700 uppercase tracking-wider cursor-pointer hover:bg-purple-100"
                    onClick={() => handleSort("revenueShare")}
                  >
                    매출비중{renderSortIcon("revenueShare")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getSortedProducts().map((product, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatNumber(product.salesCount)}건
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatNumber(product.uniqueBuyers)}명
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatNumber(product.gemAmount)}개
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatCurrency(product.pricePerGem)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600">
                      {formatPercent(product.revenueShare)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            표시할 상품 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">베스트셀러</h3>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setBestSellerTab("count")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  bestSellerTab === "count"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                판매량
              </button>
              <button
                onClick={() => setBestSellerTab("revenue")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  bestSellerTab === "revenue"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                매출
              </button>
            </div>
          </div>
          {loadingRanking ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : productRanking ? (
            <div className="space-y-2">
              {(bestSellerTab === "count"
                ? productRanking.bestSellersByCount
                : productRanking.bestSellersByRevenue
              ).map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        item.rank === 1
                          ? "bg-yellow-400 text-yellow-900"
                          : item.rank === 2
                            ? "bg-gray-300 text-gray-700"
                            : item.rank === 3
                              ? "bg-orange-300 text-orange-800"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-600">
                      {bestSellerTab === "count"
                        ? `${formatNumber(item.salesCount)}건`
                        : formatCurrency(item.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {bestSellerTab === "count"
                        ? formatCurrency(item.totalRevenue)
                        : `${formatNumber(item.salesCount)}건`}
                    </div>
                  </div>
                </div>
              ))}
              {(bestSellerTab === "count"
                ? productRanking.bestSellersByCount
                : productRanking.bestSellersByRevenue
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
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
            <h3 className="text-lg font-semibold text-gray-900">워스트셀러</h3>
            <div className="inline-flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
              <button
                onClick={() => setWorstSellerTab("count")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  worstSellerTab === "count"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                판매량
              </button>
              <button
                onClick={() => setWorstSellerTab("revenue")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  worstSellerTab === "revenue"
                    ? "bg-[#7D4EE4] text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                매출
              </button>
            </div>
          </div>
          {loadingRanking ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500" />
            </div>
          ) : productRanking ? (
            <div className="space-y-2">
              {(worstSellerTab === "count"
                ? productRanking.worstSellersByCount
                : productRanking.worstSellersByRevenue
              ).map((item) => (
                <div
                  key={item.rank}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-red-100 text-red-600 text-xs font-bold">
                      {item.rank}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {item.productName}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-red-600">
                      {worstSellerTab === "count"
                        ? `${formatNumber(item.salesCount)}건`
                        : formatCurrency(item.totalRevenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {worstSellerTab === "count"
                        ? formatCurrency(item.totalRevenue)
                        : `${formatNumber(item.salesCount)}건`}
                    </div>
                  </div>
                </div>
              ))}
              {(worstSellerTab === "count"
                ? productRanking.worstSellersByCount
                : productRanking.worstSellersByRevenue
              ).length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  데이터 없음
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">데이터 없음</div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          기간별 매출 비교
        </h3>
        {loadingPeriod ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : periodAnalysis && periodAnalysis.periods.length > 0 ? (
          <>
            <div className="h-[320px] mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={periodAnalysis.periods.map((p) => ({
                    name: p.periodName.split("(")[0].trim(),
                    매출액: p.totalRevenue,
                    판매건수: p.salesCount,
                  }))}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(v) => formatCurrency(v)}
                    tick={{ fontSize: 11 }}
                    width={80}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(v) => `${formatNumber(v)}건`}
                    tick={{ fontSize: 11 }}
                    width={60}
                  />
                  <Tooltip content={<PeriodChartTooltip />} />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="매출액"
                    fill="#7D4EE4"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="판매건수"
                    fill="#22c55e"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="overflow-x-auto mb-6">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      기간
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      총 매출
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      판매 건수
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      구매자 수
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      일평균 매출
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      일평균 판매
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periodAnalysis.periods.map((period) => (
                    <tr key={period.periodId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {period.periodName}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                        {formatCurrency(period.totalRevenue)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatNumber(period.salesCount)}건
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatNumber(period.uniqueBuyers)}명
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {formatCurrency(period.dailyAverageRevenue)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                        {period.dailyAverageSalesCount.toFixed(1)}건
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {periodAnalysis.priceElasticity.length > 0 && (
              <>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  가격 탄력성 분석
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-orange-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-orange-700 uppercase">
                          상품명
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase">
                          변경 전 판매
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase">
                          변경 후 판매
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase">
                          변화율
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase">
                          전 일평균
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-orange-700 uppercase">
                          후 일평균
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {periodAnalysis.priceElasticity.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatNumber(item.beforeCount)}건
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatNumber(item.afterCount)}건
                          </td>
                          <td
                            className={`px-4 py-3 whitespace-nowrap text-sm text-right font-medium ${
                              item.changeRate > 0
                                ? "text-green-600"
                                : item.changeRate < 0
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {item.changeRate > 0 ? "+" : ""}
                            {formatPercent(item.changeRate)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.beforeDailyAverage.toFixed(1)}건
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {item.afterDailyAverage.toFixed(1)}건
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            기간별 분석 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          구슬 소비 분석
        </h3>
        {loadingGem ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : gemConsumption ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                기능별 소비 분포
              </h4>
              {gemConsumption.byFeature.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={gemConsumption.byFeature.map((f) => ({
                          ...f,
                          name: f.featureName,
                          value: f.totalGemsConsumed,
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, consumptionShare }) =>
                          `${name} (${formatPercent(consumptionShare)})`
                        }
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {gemConsumption.byFeature.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<GemConsumptionTooltip />} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  데이터 없음
                </div>
              )}
            </div>
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">
                시간대별 사용 패턴
              </h4>
              {gemConsumption.byHour.length > 0 ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={gemConsumption.byHour}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="hour"
                        tickFormatter={(v) => `${v}시`}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 11 }}
                      />
                      <Tooltip content={<HourlyTooltip />} />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="usageCount"
                        stroke="#7D4EE4"
                        strokeWidth={2}
                        name="사용횟수"
                        dot={{ fill: "#7D4EE4", r: 3 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="totalGemsConsumed"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="소비량"
                        dot={{ fill: "#3b82f6", r: 3 }}
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
            {gemConsumption.byFeature.length > 0 && (
              <div className="lg:col-span-2">
                <h4 className="text-md font-medium text-gray-700 mb-3">
                  기능별 상세
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          기능
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          사용횟수
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          총 소비량
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          사용자 수
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          소비비중
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          회당 비용
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gemConsumption.byFeature.map((feature, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {feature.featureName}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatNumber(feature.usageCount)}회
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                            {formatNumber(feature.totalGemsConsumed)}개
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatNumber(feature.uniqueUsers)}명
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {formatPercent(feature.consumptionShare)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                            {feature.costPerUse.toFixed(1)}개
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                          총계
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatNumber(gemConsumption.totalUsageCount)}회
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-bold text-purple-600">
                          {formatNumber(gemConsumption.totalGemsConsumed)}개
                        </td>
                        <td className="px-4 py-3" colSpan={3}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            구슬 소비 데이터가 없습니다.
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          시스템 비교 (재매칭권 vs 구슬)
        </h3>
        {loadingSystem ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
            <span className="ml-2 text-gray-600">데이터를 불러오는 중...</span>
          </div>
        ) : systemComparison ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {systemComparison.systemComparison.map((system) => (
                <div
                  key={system.systemType}
                  className={`p-6 rounded-lg ${
                    system.systemType === "REMATCHING_TICKET"
                      ? "bg-gray-100"
                      : "bg-purple-50"
                  }`}
                >
                  <div className="text-sm text-gray-500 mb-1">
                    {system.systemName}
                  </div>
                  <div className="text-xs text-gray-400 mb-2">
                    {system.periodLabel}
                  </div>
                  <div
                    className={`text-2xl font-bold mb-2 ${
                      system.systemType === "REMATCHING_TICKET"
                        ? "text-gray-700"
                        : "text-purple-600"
                    }`}
                  >
                    {formatCurrency(system.totalRevenue)}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="text-gray-500">
                      판매:{" "}
                      <span className="font-medium text-gray-700">
                        {formatNumber(system.salesCount)}건
                      </span>
                    </div>
                    <div className="text-gray-500">
                      구매자:{" "}
                      <span className="font-medium text-gray-700">
                        {formatNumber(system.uniqueBuyers)}명
                      </span>
                    </div>
                    <div className="col-span-2 text-gray-500">
                      일평균:{" "}
                      <span className="font-medium text-gray-700">
                        {formatCurrency(system.dailyAverageRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-6 rounded-lg bg-green-50 flex flex-col justify-center items-center">
                <div className="text-sm text-gray-500 mb-1">성장률</div>
                <div
                  className={`text-3xl font-bold ${
                    systemComparison.revenueGrowthRate > 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {systemComparison.revenueGrowthRate > 0 ? "+" : ""}
                  {formatPercent(systemComparison.revenueGrowthRate)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  구슬 시스템 전환 후
                </div>
              </div>
            </div>

            {systemComparison.paymentMethodComparison.length > 0 && (
              <>
                <h4 className="text-md font-semibold text-gray-800 mb-3">
                  결제 수단별 비교
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          결제 수단
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          총 매출
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          판매 건수
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          구매자 수
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          매출 비중
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {systemComparison.paymentMethodComparison.map(
                        (method, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                              {method.methodName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-purple-600 font-medium">
                              {formatCurrency(method.totalRevenue)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                              {formatNumber(method.salesCount)}건
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                              {formatNumber(method.uniqueBuyers)}명
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600">
                              {formatPercent(method.revenueShare)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            시스템 비교 데이터가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
