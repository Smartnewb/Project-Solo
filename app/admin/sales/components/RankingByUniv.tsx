"use client";

import { useState, useEffect } from "react";
import { salesService } from "@/app/services/sales";
import { paymentType, UniversityRanking } from "../types";
import { formateDateToString, formatCurrency } from "../utils";

const UNIVERSITY_CLUSTER_MAP: Record<string, string> = {
  충남대학교: "DJN",
  배재대학교: "DJN",
  한밭대학교: "DJN",
  KAIST: "DJN",
  대전대학교: "DJN",
  목원대학교: "DJN",
  우송대학교: "DJN",
  침례신학대학교: "DJN",
  대덕대학교: "DJN",
  대전과학기술대학교: "DJN",
  대전보건대학교: "DJN",
  한국폴리텍대학: "DJN",
  혜천대학교: "DJN",
  "고려대학교(세종)": "SJG",
  "홍익대학교(세종)": "SJG",
  충북대학교: "CJU",
  청주대학교: "CJU",
  서원대학교: "CJU",
  충북보건과학대학교: "CJU",
  충청대학교: "CJU",
  부산대학교: "BSN",
  동아대학교: "BSN",
  부경대학교: "BSN",
  동의대학교: "BSN",
  신라대학교: "BSN",
  경성대학교: "BSN",
  경북대학교: "DGU",
  계명대학교: "DGU",
  대구대학교: "DGU",
  영남대학교: "DGU",
  공주대학교: "GJJ",
  인제대학교: "GHE",
  인하대학교: "ICN",
  인천대학교: "ICN",
  서울대학교: "SEL",
  연세대학교: "SEL",
  고려대학교: "SEL",
  성균관대학교: "SEL",
  한양대학교: "SEL",
  이화여자대학교: "SEL",
  중앙대학교: "SEL",
  경희대학교: "SEL",
  홍익대학교: "SEL",
  건국대학교: "SEL",
  동국대학교: "SEL",
  숙명여자대학교: "SEL",
  국민대학교: "SEL",
  숭실대학교: "SEL",
  세종대학교: "SEL",
  단국대학교: "SEL",
  광운대학교: "SEL",
  명지대학교: "SEL",
  아주대학교: "KYG",
  수원대학교: "KYG",
  경기대학교: "KYG",
  한신대학교: "KYG",
  "단국대학교(천안)": "CAN",
  "상명대학교(천안)": "CAN",
  순천향대학교: "CAN",
  한국기술교육대학교: "CAN",
  호서대학교: "CAN",
  나사렛대학교: "CAN",
  백석대학교: "CAN",
  전남대학교: "GWJ",
  조선대학교: "GWJ",
  광주대학교: "GWJ",
};

const CLUSTER_NAMES: Record<string, string> = {
  DJN: "대전",
  SJG: "세종",
  CJU: "청주",
  BSN: "부산",
  DGU: "대구",
  GJJ: "공주",
  GHE: "김해",
  ICN: "인천",
  SEL: "서울",
  KYG: "경기",
  CAN: "천안",
  GWJ: "광주",
  OTHER: "기타",
};

const CLUSTER_ORDER = [
  "SEL",
  "KYG",
  "ICN",
  "DJN",
  "CAN",
  "SJG",
  "CJU",
  "GJJ",
  "BSN",
  "DGU",
  "GWJ",
  "GHE",
  "OTHER",
];

interface RankingItem {
  universityName: string;
  amount: number;
  count: number;
  paidUserCount?: number;
  averageAmount?: number;
  rank?: number;
  percentage?: number;
}

type ViewMode = "top20" | "byCluster";

interface RankingByUnivProps {
  startDate?: Date;
  endDate?: Date;
}

export function RankingByUniv({ startDate, endDate }: RankingByUnivProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedPaymentType, setSelectedPaymentType] =
    useState<paymentType>("all");
  const [totalData, setTotalData] = useState<UniversityRanking | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(50);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(5);
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>();

  const [viewMode, setViewMode] = useState<ViewMode>("top20");
  const [expandedClusters, setExpandedClusters] = useState<string[]>([]);

  const getDefaultDateRange = () => {
    const today = new Date();
    const serviceStartDate = new Date("2019-01-01");
    return { start: serviceStartDate, end: today };
  };

  const getEffectiveDates = () => {
    if (startDate && endDate) {
      return { start: startDate, end: endDate };
    }
    return getDefaultDateRange();
  };

  const fetchRankingData = async () => {
    const { start, end } = getEffectiveDates();

    setIsLoading(true);

    const startDateString = formateDateToString(start);
    const endDateString = formateDateToString(end);
    console.log("대학 순위 startDate:", startDateString);
    console.log("대학 순위 endDate:", endDateString);

    try {
      const response = await salesService.getUniversityRank({
        startDate: startDateString,
        endDate: endDateString,
        paymentType:
          selectedPaymentType !== "all" ? selectedPaymentType : "all",
      });

      if (response) {
        setTotalData(response);
      } else {
        console.log("대학 랭킹 데이터 없음");
        setTotalData(null);
      }
    } catch (error) {
      setTotalData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(
      () => {
        fetchRankingData();
        setLastUpdated(new Date());
      },
      refreshInterval * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  useEffect(() => {
    if (currentPage > 1) {
      fetchRankingData();
    }
  }, [currentPage]);

  useEffect(() => {
    fetchRankingData();
  }, [startDate, endDate]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (newPage === currentPage) return;
    setCurrentPage(newPage);
  };

  const handleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const handleRefrehIntervalChange = (interval: number) => {
    setRefreshInterval(interval);
  };

  const toggleCluster = (clusterCode: string) => {
    setExpandedClusters((prev) =>
      prev.includes(clusterCode)
        ? prev.filter((c) => c !== clusterCode)
        : [...prev, clusterCode],
    );
  };

  const expandAllClusters = () => {
    setExpandedClusters(CLUSTER_ORDER);
  };

  const collapseAllClusters = () => {
    setExpandedClusters([]);
  };

  const getClusterForUniversity = (univName: string): string => {
    return UNIVERSITY_CLUSTER_MAP[univName] || "OTHER";
  };

  const getRankingData = (): RankingItem[] => {
    if (!totalData) return [];
    if (totalData.data) {
      return totalData.data.map((item, index) => ({
        rank: index + 1,
        universityName: item.universityName,
        amount: item.amount,
        count: item.count,
        percentage: item.percentage,
        paidUserCount: 0,
        averageAmount: item.count > 0 ? item.amount / item.count : 0,
      }));
    }
    if (totalData.rankings) {
      return totalData.rankings;
    }
    return [];
  };

  const getTop20Data = (data: RankingItem[]): RankingItem[] => {
    return [...data]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 20)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  };

  const groupByCluster = (
    data: RankingItem[],
  ): Record<string, RankingItem[]> => {
    const grouped: Record<string, RankingItem[]> = {};

    data.forEach((item) => {
      const cluster = getClusterForUniversity(item.universityName);
      if (!grouped[cluster]) {
        grouped[cluster] = [];
      }
      grouped[cluster].push(item);
    });

    Object.keys(grouped).forEach((cluster) => {
      grouped[cluster].sort((a, b) => b.amount - a.amount);
    });

    return grouped;
  };

  const getClusterTotal = (items: RankingItem[]): number => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  const getClusterCount = (items: RankingItem[]): number => {
    return items.reduce((sum, item) => sum + item.count, 0);
  };

  const getMedalIcon = (rank: number): string | null => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  const rankingData = getRankingData();
  const top20Data = getTop20Data(rankingData);
  const groupedData = groupByCluster(rankingData);
  const sortedClusters = CLUSTER_ORDER.filter(
    (c) => groupedData[c]?.length > 0,
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            대학별 매출 순위
          </h3>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("top20")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === "top20"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                전체 Top 20
              </button>
              <button
                onClick={() => setViewMode("byCluster")}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                  viewMode === "byCluster"
                    ? "bg-white text-purple-700 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                클러스터별
              </button>
            </div>
          </div>
        </div>

        {viewMode === "byCluster" && (
          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={expandAllClusters}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              모두 펼치기
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={collapseAllClusters}
              className="text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              모두 접기
            </button>
          </div>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-500">데이터 로딩중...</span>
          </div>
        </div>
      )}

      {!isLoading && rankingData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <p className="text-gray-500">데이터가 없습니다</p>
        </div>
      )}

      {!isLoading && viewMode === "top20" && rankingData.length > 0 && (
        <div className="p-6">
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-purple-50 to-indigo-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider w-16">
                    순위
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    대학명
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    클러스터
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    매출
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    결제건수
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    비율
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-purple-800 uppercase tracking-wider">
                    평균매출
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {top20Data.map((item, index) => {
                  const medal = getMedalIcon(item.rank || index + 1);
                  const cluster = getClusterForUniversity(item.universityName);
                  const isTopThree = (item.rank || index + 1) <= 3;

                  return (
                    <tr
                      key={index}
                      className={`transition-colors ${
                        isTopThree
                          ? "bg-gradient-to-r from-amber-50/50 to-transparent hover:from-amber-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {medal ? (
                            <span className="text-lg">{medal}</span>
                          ) : (
                            <span className="text-sm font-bold text-gray-400 w-6 text-center">
                              {item.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`text-sm font-medium ${isTopThree ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {item.universityName}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                          {CLUSTER_NAMES[cluster]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span
                          className={`text-sm font-semibold ${isTopThree ? "text-purple-700" : "text-blue-600"}`}
                        >
                          {formatCurrency(item.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gray-600">
                          {item.count}건
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-purple-600 font-medium">
                          {item.percentage !== undefined
                            ? `${item.percentage.toFixed(1)}%`
                            : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className="text-sm text-gray-600">
                          {item.averageAmount !== undefined
                            ? formatCurrency(item.averageAmount)
                            : item.count > 0
                              ? formatCurrency(item.amount / item.count)
                              : formatCurrency(0)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-right">
            전체 {rankingData.length}개 대학 중 상위 20개 표시
          </p>
        </div>
      )}

      {!isLoading && viewMode === "byCluster" && rankingData.length > 0 && (
        <div className="p-6 space-y-3">
          {sortedClusters.map((clusterCode) => {
            const clusterItems = groupedData[clusterCode];
            const isExpanded = expandedClusters.includes(clusterCode);
            const clusterTotal = getClusterTotal(clusterItems);
            const clusterCount = getClusterCount(clusterItems);

            return (
              <div
                key={clusterCode}
                className="rounded-lg border border-gray-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleCluster(clusterCode)}
                  className={`w-full px-5 py-4 flex items-center justify-between transition-colors ${
                    isExpanded
                      ? "bg-purple-50 border-b border-purple-100"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <svg
                      className={`w-5 h-5 text-purple-500 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">
                        {CLUSTER_NAMES[clusterCode]}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">
                        {clusterCode}
                      </span>
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold">
                        {clusterItems.length}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-gray-400">총 매출</p>
                      <p className="text-sm font-bold text-purple-700">
                        {formatCurrency(clusterTotal)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">결제건수</p>
                      <p className="text-sm font-semibold text-gray-700">
                        {clusterCount}건
                      </p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-white">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            #
                          </th>
                          <th className="px-5 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            대학명
                          </th>
                          <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            매출
                          </th>
                          <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            결제건수
                          </th>
                          <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            비율
                          </th>
                          <th className="px-5 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            평균매출
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {clusterItems.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-5 py-3 text-sm text-gray-400 font-medium">
                              {idx + 1}
                            </td>
                            <td className="px-5 py-3 text-sm font-medium text-gray-900">
                              {item.universityName}
                            </td>
                            <td className="px-5 py-3 text-right text-sm font-semibold text-blue-600">
                              {formatCurrency(item.amount)}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-gray-600">
                              {item.count}건
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-purple-600 font-medium">
                              {item.percentage !== undefined
                                ? `${item.percentage.toFixed(1)}%`
                                : "-"}
                            </td>
                            <td className="px-5 py-3 text-right text-sm text-gray-600">
                              {item.averageAmount !== undefined
                                ? formatCurrency(item.averageAmount)
                                : item.count > 0
                                  ? formatCurrency(item.amount / item.count)
                                  : formatCurrency(0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="px-6 py-3 border-t border-gray-100 bg-gray-50/50">
        <p className="text-xs text-gray-400 text-center">
          {viewMode === "top20"
            ? "전체 Top 20"
            : `${sortedClusters.length}개 클러스터`}{" "}
          · 총 {rankingData.length}개 대학
        </p>
      </div>
    </div>
  );
}
