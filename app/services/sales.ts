// TITLE: - 어드민 매출 지표 서비스 레이어
import axiosServer from "@/utils/axios";
import {
  CustomSalesRequest,
  CustomSalesResponse,
  DailySalesResponse,
  MonthlySalesResponse,
  TotalSalesResponse,
  TrendCustomRequest,
  TrendCustomResponse,
  TrendDailyResponse,
  TrendMonthlyResponse,
  TrendWeeklyResponse,
  UniversityRanking,
  WeeklySalesResponse,
  PaymentAnalysis,
  GenderAnalysis,
  AgeAnalysis,
  PaymentSuccessRateResponse,
  IapStatsResponse,
  RevenueMetricsResponse,
  AverageOrderValueResponse,
  RepurchaseAnalysisResponse,
  ConversionRateResponse,
  LtvAnalysisResponse,
  RevenueMetricsTrendResponse,
  ProductSalesResponse,
  ProductRankingResponse,
  PeriodAnalysisResponse,
  GemConsumptionResponse,
  SystemComparisonResponse,
  GemTriggerResponse,
  FeatureFunnelResponse,
  FirstPurchaseResponse,
  WhaleUserResponse,
  GemEconomyResponse,
  MatchingFunnelResponse,
} from "../admin/sales/types";
import { paymentType } from "@/app/admin/sales/types";
import { da } from "date-fns/locale";
import { University } from "../admin/users/appearance/types";

// MARK: - 엔드포인트
const SALES_ENDPOINT = {
  TOTAL: "/admin/stats/sales/total",
  DAILY: "/admin/stats/sales/daily",
  WEEKLY: "/admin/stats/sales/weekly",
  MONTHLY: "/admin/stats/sales/monthly",
  CUSTOM_PERIOD: "/admin/stats/sales/custom-period",
  TREND_DAILY: "/admin/stats/sales/trend/daily",
  TREND_WEEKLY: "/admin/stats/sales/trend/weekly",
  TREND_MONTHLY: "/admin/stats/sales/trend/monthly",
  TREND_CUSTOM: "/admin/stats/sales/trend/custom-period",
  SUCCESS_RATE: "/admin/stats/sales/success-rate",
  UNIVERSITY_RANKING: "/admin/stats/sales/university-ranking",
  PAYMENT_ANALYSIS: "/admin/stats/sales/payment-method-analysis",
  GENDER_ANALYSIS: "/admin/stats/sales/gender-analysis",
  AGE_ANALYSIS: "/admin/stats/sales/age-analysis",
  IAP_STATS: "/admin/iap-payments/stats",
  REVENUE_METRICS: "/admin/stats/sales/revenue-metrics",
  AOV: "/admin/stats/sales/aov",
  REPURCHASE_ANALYSIS: "/admin/stats/sales/repurchase-analysis",
  CONVERSION_RATE: "/admin/stats/sales/conversion-rate",
  LTV: "/admin/stats/sales/ltv",
  REVENUE_METRICS_TREND: "/admin/stats/sales/revenue-metrics/trend",
  PRODUCT_SALES: "/admin/stats/products/sales",
  PRODUCT_RANKING: "/admin/stats/products/ranking",
  PERIOD_ANALYSIS: "/admin/stats/products/period-analysis",
  GEM_CONSUMPTION: "/admin/stats/products/gem-consumption",
  SYSTEM_COMPARISON: "/admin/stats/products/system-comparison",
  INSIGHTS_GEM_TRIGGER: "/admin/stats/insights/gem-trigger",
  INSIGHTS_FEATURE_FUNNEL: "/admin/stats/insights/feature-funnel",
  INSIGHTS_FIRST_PURCHASE: "/admin/stats/insights/first-purchase",
  INSIGHTS_WHALE_USERS: "/admin/stats/insights/whale-users",
  INSIGHTS_GEM_ECONOMY: "/admin/stats/insights/gem-economy",
  INSIGHTS_MATCHING_FUNNEL: "/admin/stats/insights/matching-funnel",
} as const;

// MARK: - 공통 매출액 조회 파라미터
export interface GetSales {
  paymentType: paymentType;
  byRegion: boolean;
}

export interface GetAnalysis {
  paymentType: paymentType;
  startDate: string;
  endDate: string;
}

export const salesService = {
  // MARK: - 총 매출액 조회
  async getSalesTotal(data: GetSales): Promise<TotalSalesResponse> {
    try {
      console.log("getSalesTotal API 호출:", data);

      // 전체 기간 조회를 위한 파라미터 처리
      const params: any = { ...data };

      // 날짜가 없으면 전체 기간 조회
      if (!params.startDate && !params.endDate) {
        console.log("🌍 전체 기간 총 매출액 조회");
        // 백엔드에서 전체 기간을 의미하는 특별한 값 전달 (또는 파라미터 제거)
        delete params.startDate;
        delete params.endDate;
      }

      const response = await axiosServer.get(SALES_ENDPOINT.TOTAL, {
        params: params,
      });

      console.log("getSalesTotal API 응답:", response.data);

      if (!response.data) {
        throw new Error("API 응답이 비어있습니다.");
      }

      return response.data;
    } catch (error) {
      console.error("총 매출액 조회 실패:", error);
      throw new SalesApiError("총 매출액 조회 실패:", error);
    }
  },

  // MARK: - 일간 매출액 조회
  async getSalesDaily(data: GetSales): Promise<DailySalesResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.DAILY, {
        params: data,
      });

      console.log("getSalesDaily API 응답:", response.data);
      return response.data;
    } catch (error) {
      throw new SalesApiError("일간 매출액 조회 실패:", error);
    }
  },

  // MARK: - 주간 매출액 조회
  async getSalesWeekly(data: GetSales): Promise<WeeklySalesResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.WEEKLY, {
        params: data,
      });

      return response.data;
    } catch (error) {
      throw new SalesApiError("주간 매출액 조회 실패:", error);
    }
  },

  // MARK: - 월간 매출액 조회
  async getSalesMonthly(data: GetSales): Promise<MonthlySalesResponse> {
    try {
      const reponse = await axiosServer.get(SALES_ENDPOINT.TREND_MONTHLY, {
        params: data,
      });
      return reponse.data;
    } catch (error) {
      throw new SalesApiError("월간 매출액 조회", error);
    }
  },

  // MARK: - 사용자 지정 기간 매출액 조회 개선
  async getSalesCustom(data: CustomSalesRequest): Promise<CustomSalesResponse> {
    try {
      console.log("getSalesCustom API 호출 파라미터:", data);

      // 전체 기간 조회인지 확인
      const isFullPeriod = !data.startDate && !data.endDate;

      if (isFullPeriod) {
        console.log("🌍 전체 기간 매출 데이터 조회 중...");
      }

      const response = await axiosServer.post(
        SALES_ENDPOINT.CUSTOM_PERIOD,
        data,
      );

      console.log("getSalesCustom API 응답:", response.data);

      // 응답 데이터 검증 및 정규화
      const normalizedData = {
        totalSales: response.data.totalSales || response.data.dailySales || 0,
        totalCount: response.data.totalCount || response.data.dailyCount || 0,
        totalPaidUsers: response.data.totalPaidUsers || 0,
        dailySales: response.data.dailySales || response.data.totalSales || 0,
        dailyCount: response.data.dailyCount || response.data.totalCount || 0,
        regionalData: response.data.regionalData || [],
        paymentData: response.data.paymentData || [],
        // API에서 실제 조회된 날짜 범위 정보
        startDate: response.data.startDate,
        endDate: response.data.endDate,
        paymentType: response.data.paymentType,
        // 메타 정보
        isFullPeriod: isFullPeriod,
        currency: "KRW",
      };

      return normalizedData;
    } catch (error) {
      console.error("사용자 지정 매출액 조회 실패:", error);
      throw new SalesApiError("사용자 지정 매출액 조회 실패:", error);
    }
  },

  // MARK: - 일별 매출 추이 조회
  async getTrendDaily(data: GetSales): Promise<TrendDailyResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.TREND_DAILY, {
        params: data,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("일별 매출 추이 조회 실패:", error);
    }
  },

  // MARK: - 주별 매출 추이 조회
  async getTrendWeekly(data: GetSales): Promise<TrendWeeklyResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.TREND_WEEKLY, {
        params: data,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("주별 매출 추이 조회 실패:", error);
    }
  },

  // MARK: - 월별 매출 추이 조회
  async getTrendMonthly(data: GetSales): Promise<TrendMonthlyResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.TREND_MONTHLY, {
        params: data,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("월별 매출 추이 조회 실패:", error);
    }
  },

  // MARK: - 사용자 지정 기간 매출 추이 조회
  async getTrendCustom(data: TrendCustomRequest): Promise<TrendCustomResponse> {
    try {
      const response = await axiosServer.post(
        SALES_ENDPOINT.TREND_CUSTOM,
        data,
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("사용자 지정 매출액 조회 실패:", error);
    }
  },

  // MARK: - 결제 성공률 조회
  async getSuccessRate(): Promise<PaymentSuccessRateResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.SUCCESS_RATE);
      return response.data;
    } catch (error) {
      throw new SalesApiError("결제 성공률 조회 실패:", error);
    }
  },

  // MARK: - 대학별 매출 순위 조회
  async getUniversityRank(data: GetAnalysis): Promise<UniversityRanking> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.UNIVERSITY_RANKING,
        { params: data },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("대학별 매출 순위 조회 실패:", error);
    }
  },

  // MARK: - 결제수단별 상세 분석
  async getPaymentAnalysis(data: {
    startDate: string;
    endDate: string;
  }): Promise<PaymentAnalysis> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.PAYMENT_ANALYSIS, {
        params: {
          startDate: data.startDate,
          endDate: data.endDate,
        },
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("결제수단별 상세 분석 조회 실패:", error);
    }
  },

  // MARK: - 성별 구매 분석
  async getGenderAnalysis(data: GetAnalysis): Promise<GenderAnalysis> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.GENDER_ANALYSIS, {
        params: data,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("성별 구매 분석 조회 실패:", error);
    }
  },

  // MARK: - 연령대별 구매 분석
  async getAgeAnalysis(data: GetAnalysis): Promise<AgeAnalysis> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.AGE_ANALYSIS, {
        params: data,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("연령대별 구매 분석 조회 실패:", error);
    }
  },

  // MARK: - IAP 통계 조회
  async getIapStats(): Promise<IapStatsResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.IAP_STATS);
      return response.data;
    } catch (error) {
      throw new SalesApiError("IAP 통계 조회 실패:", error);
    }
  },

  // MARK: - 수익 지표 (ARPU, ARPPU, PUR)
  async getRevenueMetrics(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<RevenueMetricsResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.REVENUE_METRICS, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("수익 지표 조회 실패:", error);
    }
  },

  // MARK: - 평균 주문 금액 (AOV)
  async getAverageOrderValue(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<AverageOrderValueResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.AOV, { params });
      return response.data;
    } catch (error) {
      throw new SalesApiError("평균 주문 금액 조회 실패:", error);
    }
  },

  // MARK: - 재구매 분석
  async getRepurchaseAnalysis(): Promise<RepurchaseAnalysisResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.REPURCHASE_ANALYSIS,
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("재구매 분석 조회 실패:", error);
    }
  },

  // MARK: - 결제 전환율
  async getConversionRate(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<ConversionRateResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.CONVERSION_RATE, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("결제 전환율 조회 실패:", error);
    }
  },

  // MARK: - LTV 분석
  async getLtvAnalysis(): Promise<LtvAnalysisResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.LTV);
      return response.data;
    } catch (error) {
      throw new SalesApiError("LTV 분석 조회 실패:", error);
    }
  },

  // MARK: - 수익 지표 추이
  async getRevenueMetricsTrend(params?: {
    startDate?: string;
    endDate?: string;
    granularity?: "daily" | "weekly" | "monthly";
  }): Promise<RevenueMetricsTrendResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.REVENUE_METRICS_TREND,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("수익 지표 추이 조회 실패:", error);
    }
  },

  async getProductSales(params?: {
    startDate?: string;
    endDate?: string;
    pricePeriod?: string;
  }): Promise<ProductSalesResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.PRODUCT_SALES, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("상품별 판매 현황 조회 실패:", error);
    }
  },

  async getProductRanking(params?: {
    startDate?: string;
    endDate?: string;
    pricePeriod?: string;
  }): Promise<ProductRankingResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.PRODUCT_RANKING, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("상품 랭킹 조회 실패:", error);
    }
  },

  async getPeriodAnalysis(): Promise<PeriodAnalysisResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.PERIOD_ANALYSIS);
      return response.data;
    } catch (error) {
      throw new SalesApiError("기간별 분석 조회 실패:", error);
    }
  },

  async getGemConsumption(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GemConsumptionResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.GEM_CONSUMPTION, {
        params,
      });
      return response.data;
    } catch (error) {
      throw new SalesApiError("구슬 소비 분석 조회 실패:", error);
    }
  },

  async getSystemComparison(): Promise<SystemComparisonResponse> {
    try {
      const response = await axiosServer.get(SALES_ENDPOINT.SYSTEM_COMPARISON);
      return response.data;
    } catch (error) {
      throw new SalesApiError("시스템 비교 조회 실패:", error);
    }
  },

  async getGemTrigger(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GemTriggerResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_GEM_TRIGGER,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("구슬 잔액 트리거 분석 조회 실패:", error);
    }
  },

  async getFeatureFunnel(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<FeatureFunnelResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_FEATURE_FUNNEL,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("기능→결제 퍼널 분석 조회 실패:", error);
    }
  },

  async getFirstPurchase(): Promise<FirstPurchaseResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_FIRST_PURCHASE,
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("첫 결제 트리거 분석 조회 실패:", error);
    }
  },

  async getWhaleUsers(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<WhaleUserResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_WHALE_USERS,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("고래 유저 분석 조회 실패:", error);
    }
  },

  async getGemEconomy(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<GemEconomyResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_GEM_ECONOMY,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("구슬 경제 밸런스 분석 조회 실패:", error);
    }
  },

  async getMatchingFunnel(params?: {
    startDate?: string;
    endDate?: string;
  }): Promise<MatchingFunnelResponse> {
    try {
      const response = await axiosServer.get(
        SALES_ENDPOINT.INSIGHTS_MATCHING_FUNNEL,
        { params },
      );
      return response.data;
    } catch (error) {
      throw new SalesApiError("매칭→수익화 퍼널 분석 조회 실패:", error);
    }
  },
};

// MARK: - 에러처리
export class SalesApiError extends Error {
  public statusCode?: number;
  public details?: any;
  public originalError: any;

  constructor(message: string, originalError?: any) {
    super(message);

    this.name = "SalesApiError";
    this.originalError = originalError;

    if (originalError?.response) {
      this.statusCode = originalError.response.status;
      this.details = originalError.response.data;
    }
  }
}
