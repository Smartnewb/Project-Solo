// TITLE: - 어드민 매출 지표 관련 타입 정의


// === 타입 ===
export type paymentType = 'all' | 'iap_only' | 'exclude_iap';

// === 도메인 엔티티 ===
// MARK: - 지역별 매출액 (기존 기능 유지)
export interface RegionSales {
    region: string;
    amount?: number;
    count?: number;
    paidUserCount?: number;
};

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
};

// MARK: - 기간 설정
export interface DatePicker {
    startDate?: string;
    endDate?: string;
};



// === API 모델 ===
// MARK: - 총 매출액 조회 응답
export interface TotalSalesResponse {
    totalSales: number;
    totalCount: number;
    // 확장 필드 (백엔드에서 제공 시)
    totalPaidUsers?: number;
    regionalData?: RegionSales[];
};

// MARK: - 일간 매출액 조회 응답
export interface DailySalesResponse {
    dailySales: number;
    dailyCount: number;
    // 확장 필드
    dailyPaidUsers?: number;
    regionalData?: RegionSales[];
};

// MARK: - 주간 매출액 조회 응답
export interface WeeklySalesResponse {
    weeklySales: number;
    weeklyCount: number;
    // 확장 필드
    weeklyPaidUsers?: number;
    regionalData?: RegionSales[];
};

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
};

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
};

// MARK: - 일별 매출 추이 조회
export interface TrendDailyResponse {
    data: SalesTransition[];
};

// MARK: - 주별 매출 추이 조회
export interface TrendWeeklyResponse {
    data: SalesTransition[];
};

// MARK: - 월별 매출 추이 조회
export interface TrendMonthlyResponse {
    data: SalesTransition[];
};

// MARK: - 사용자 지정 기간 매출 추이 조회 요청
export interface TrendCustomRequest {
    startDate?: string;
    endDate?: string;
    paymentType?: paymentType;
    byRegion?: boolean;
    useCluster?: boolean;
};

// MARK: - 사용자 지정 기간 매출 추이 조회 응답
export interface TrendCustomResponse {
    startDate?: string;
    endDate?: string;
    data: SalesTransition[];
};

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


// MARK: - 성별 구매 분석
export interface GenderSalesItem extends AnalysisItem {
    gender: 'MALE' | 'FEMALE';
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
