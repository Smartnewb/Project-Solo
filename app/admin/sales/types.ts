// TITLE: - 어드민 매출 지표 관련 타입 정의

// === 타입 ===
export type paymentType = "all" | "iap_only" | "exclude_iap";

// === 도메인 엔티티 ===
// MARK: - 지역별 매출액 (기존 기능 유지)
export interface RegionSales {
  region: string;
  amount?: number;
  count?: number;
  paidUserCount?: number;
}

// MARK: - 매출액 추이 (API 스펙에 맞게 수정)
export interface SalesTrendPoint {
  label: string;
  amount: number;
  count: number;
}

// MARK: - 매출 추이 (확장 - 기존 기능 호환용)
export interface SalesTransition extends SalesTrendPoint {
  paidUserCount?: number;
  regionalData?: RegionSales[];
  excludeIapAmount?: number;
  excludeIapCount?: number;
  excludeIapPaidUserCount?: number;
  iapOnlyAmount?: number;
  iapOnlyCount?: number;
  iapOnlyPaidUserCount?: number;
}

// MARK: - 기간 설정
export interface DatePicker {
  startDate?: string;
  endDate?: string;
}

// === API 모델 ===
// MARK: - 총 매출액 조회 응답
export interface TotalSalesResponse {
  totalSales: number;
  totalCount: number;
  // 확장 필드 (백엔드에서 제공 시)
  totalPaidUsers?: number;
  regionalData?: RegionSales[];
}

// MARK: - 일간 매출액 조회 응답
export interface DailySalesResponse {
  dailySales: number;
  dailyCount: number;
  // 확장 필드
  dailyPaidUsers?: number;
  regionalData?: RegionSales[];
}

// MARK: - 주간 매출액 조회 응답
export interface WeeklySalesResponse {
  weeklySales: number;
  weeklyCount: number;
  // 확장 필드
  weeklyPaidUsers?: number;
  regionalData?: RegionSales[];
}

// MARK: - 월간 매출액 조회 응답
export interface MonthlySalesResponse {
  monthlySales: number;
  monthlyCount: number;
  // 확장 필드
  monthlyPaidUsers?: number;
  regionalData?: RegionSales[];
}

// MARK: - 사용자 지정 기간 매출액 조회 요청
export interface CustomSalesRequest {
  startDate: string;
  endDate: string;
  paymentType?: paymentType;
  byRegion?: boolean;
  useCluster?: boolean;
}

// MARK: - 사용자 지정 기간 매출액 조회 응답
export interface CustomSalesResponse {
  totalSales: number;
  totalCount: number;
  startDate?: string;
  endDate?: string;
  // 확장 필드
  totalPaidUsers?: number;
  paymentType?: string;
  regionalData?: RegionSales[];
}

// MARK: - 일별 매출 추이 조회
export interface TrendDailyResponse {
  data: SalesTransition[];
}

// MARK: - 주별 매출 추이 조회
export interface TrendWeeklyResponse {
  data: SalesTransition[];
}

// MARK: - 월별 매출 추이 조회
export interface TrendMonthlyResponse {
  data: SalesTransition[];
}

// MARK: - 사용자 지정 기간 매출 추이 조회 요청
export interface TrendCustomRequest {
  startDate?: string;
  endDate?: string;
  paymentType?: paymentType;
  byRegion?: boolean;
  useCluster?: boolean;
}

// MARK: - 사용자 지정 기간 매출 추이 조회 응답
export interface TrendCustomResponse {
  startDate?: string;
  endDate?: string;
  data: SalesTransition[];
}

// MARK: - 결제 성공률 조회 응답
export interface PaymentSuccessRateResponse {
  date: string;
  totalAttempts: number;
  successfulPayments: number;
  successRate: number;
}

// MARK: - 대학별 매출 순위 조회
export interface UniversitySalesItem {
  universityName: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface UniversityRankingResponse {
  data: UniversitySalesItem[];
  totalAmount: number;
  totalCount: number;
}

// 기존 호환을 위한 별칭
export interface RankingItem {
  universityName: string;
  amount: number;
  count: number;
  paidUserCount?: number;
  averageAmount?: number;
  rank?: number;
  percentage?: number;
}

export interface UniversityRanking {
  rankings?: RankingItem[];
  data?: UniversitySalesItem[];
  totalAmount?: number;
  totalCount?: number;
}

// MARK: - 상세분석 공통 필드 (API 스펙에 맞게 수정)
interface AnalysisItem {
  amount: number;
  count: number;
  percentage: number;
}

// MARK: - 결제수단 별 상세 분석
export interface PaymentMethodSalesItem extends AnalysisItem {
  method: string;
}

export interface PaymentMethodAnalysisResponse {
  data: PaymentMethodSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// 기존 호환을 위한 타입
interface PaymentAnalysisItem {
  paymentType: string;
  totalAmount: number;
  count: number;
  averageAmount?: number;
  percentage: number;
  netAmount?: number;
}

export interface PaymentAnalysis {
  analysis?: PaymentAnalysisItem[];
  data?: PaymentMethodSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// MARK: - IAP 통계 응답
export interface IapStatsResponse {
  paidUserCount: number;
  arppu: number;
}

// MARK: - 성별 구매 분석
export interface GenderSalesItem extends AnalysisItem {
  gender: "MALE" | "FEMALE";
}

export interface GenderSalesAnalysisResponse {
  data: GenderSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// 기존 호환을 위한 타입
interface GenderAnalysisItem {
  gender: string;
  totalAmount: number;
  count: number;
  averageAmount?: number;
  percentage: number;
}

export interface GenderAnalysis {
  analysis?: GenderAnalysisItem[];
  data?: GenderSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// MARK: - 연령대별 구매 분석
export interface AgeGroupSalesItem extends AnalysisItem {
  ageGroup: string;
}

export interface AgeSalesAnalysisResponse {
  data: AgeGroupSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// 기존 호환을 위한 타입
interface AgeAnalysisItem {
  ageGroup: string;
  totalAmount: number;
  count: number;
  averageAmount?: number;
  percentage: number;
}

export interface AgeAnalysis {
  analysis?: AgeAnalysisItem[];
  data?: AgeGroupSalesItem[];
  totalAmount: number;
  totalCount: number;
}

// MARK: - 수익 지표 (ARPU, ARPPU, PUR)
export interface RevenueMetricsPeriod {
  startDate: string;
  endDate: string;
}

export interface RevenueMetricsResponse {
  arpu: number;
  arppu: number;
  payingUserRate: number;
  totalUsers: number;
  payingUsers: number;
  totalRevenue: number;
  period?: RevenueMetricsPeriod;
}

// MARK: - 평균 주문 금액 (AOV)
export interface AverageOrderValueResponse {
  aov: number;
  totalRevenue: number;
  totalOrders: number;
  period?: RevenueMetricsPeriod;
}

// MARK: - 재구매 분석
export interface PurchaseCountDistributionItem {
  purchaseCount: number;
  userCount: number;
  percentage: number;
}

export interface RepurchaseAnalysisResponse {
  repeatPurchaseRate: number;
  totalPurchasers: number;
  repeatPurchasers: number;
  avgPurchaseCount: number;
  avgDaysBetweenPurchases: number;
  purchaseCountDistribution: PurchaseCountDistributionItem[];
}

// MARK: - 결제 전환율
export interface ConversionRateResponse {
  conversionRate: number;
  totalUsers: number;
  convertedUsers: number;
  avgDaysToFirstPurchase: number;
  period?: RevenueMetricsPeriod;
}

// MARK: - LTV 분석
export interface CohortLtvItem {
  cohort: string;
  userCount: number;
  ltv7Days: number;
  ltv30Days: number;
  ltv90Days: number;
}

export interface LtvAnalysisResponse {
  avgLtv: number;
  avgLtv7Days: number;
  avgLtv30Days: number;
  avgLtv90Days: number;
  cohortData: CohortLtvItem[];
}

// MARK: - 수익 지표 추이
export interface RevenueMetricsTrendPoint {
  label: string;
  arpu: number;
  arppu: number;
  payingUserRate: number;
  aov: number;
}

export interface RevenueMetricsTrendResponse {
  data: RevenueMetricsTrendPoint[];
  period?: RevenueMetricsPeriod;
}

export enum PricePeriod {
  PERIOD_0 = "PERIOD_0",
  PERIOD_1 = "PERIOD_1",
  PERIOD_2 = "PERIOD_2",
  PERIOD_3 = "PERIOD_3",
}

export const PRICE_PERIOD_NAMES: Record<PricePeriod, string> = {
  [PricePeriod.PERIOD_0]: "재매칭권 시대 (~2025-07-07)",
  [PricePeriod.PERIOD_1]: "구슬 초기/저가 정책 (2025-07-08 ~ 2025-09-05)",
  [PricePeriod.PERIOD_2]: "구슬 인상/고가 정책 (2025-09-06 ~ 2025-12-25)",
  [PricePeriod.PERIOD_3]: "현재 정책 (2025-12-26~)",
};

export interface ProductSalesItem {
  productName: string;
  salesCount: number;
  totalRevenue: number;
  uniqueBuyers: number;
  gemAmount: number;
  pricePerGem: number;
  revenueShare: number;
}

export interface ProductSalesResponse {
  products: ProductSalesItem[];
  totalRevenue: number;
  totalSalesCount: number;
  totalUniqueBuyers: number;
  startDate?: string;
  endDate?: string;
}

export interface ProductRankingItem {
  rank: number;
  productName: string;
  salesCount: number;
  totalRevenue: number;
  uniqueBuyers: number;
}

export interface ProductRankingResponse {
  bestSellersByCount: ProductRankingItem[];
  bestSellersByRevenue: ProductRankingItem[];
  worstSellersByCount: ProductRankingItem[];
  worstSellersByRevenue: ProductRankingItem[];
}

export interface PeriodComparisonItem {
  periodId: PricePeriod;
  periodName: string;
  startDate: string | null;
  endDate: string | null;
  dayCount: number;
  totalRevenue: number;
  salesCount: number;
  uniqueBuyers: number;
  totalActiveUsers: number;
  dailyAverageRevenue: number;
  dailyAverageSalesCount: number;
  arpu: number;
  arppu: number;
  conversionRate: number;
  growthRate: number | null;
}

export interface PriceElasticityItem {
  productName: string;
  beforeCount: number;
  afterCount: number;
  changeRate: number;
  beforeDailyAverage: number;
  afterDailyAverage: number;
}

export interface PeriodAnalysisResponse {
  periods: PeriodComparisonItem[];
  priceElasticity: PriceElasticityItem[];
}

export interface GemConsumptionItem {
  featureType: string;
  featureName: string;
  usageCount: number;
  totalGemsConsumed: number;
  uniqueUsers: number;
  consumptionShare: number;
  costPerUse: number;
}

export interface HourlyConsumptionItem {
  hour: number;
  usageCount: number;
  totalGemsConsumed: number;
}

export interface GemConsumptionResponse {
  byFeature: GemConsumptionItem[];
  byHour: HourlyConsumptionItem[];
  totalGemsConsumed: number;
  totalUsageCount: number;
  startDate?: string;
  endDate?: string;
}

export interface SystemComparisonItem {
  systemType: "REMATCHING_TICKET" | "GEM_SYSTEM";
  systemName: string;
  periodLabel: string;
  dayCount: number;
  totalRevenue: number;
  salesCount: number;
  uniqueBuyers: number;
  totalActiveUsers: number;
  dailyAverageRevenue: number;
  arpu: number;
  arppu: number;
  conversionRate: number;
}

export interface PaymentMethodComparisonItem {
  paymentMethod: string;
  methodName: string;
  totalRevenue: number;
  salesCount: number;
  uniqueBuyers: number;
  revenueShare: number;
}

export interface SystemComparisonResponse {
  systemComparison: SystemComparisonItem[];
  paymentMethodComparison: PaymentMethodComparisonItem[];
  rematchingTicketRevenue: number;
  gemSystemRevenue: number;
  revenueGrowthRate: number;
}
