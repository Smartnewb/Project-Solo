// TITLE: - 어드민 매출 지표 관련 타입 정의


// === 타입 ===
export type paymentType = 'all' | 'iap_only' | 'exclude_iap';

// === 도메인 엔티티 ===
// MARK: - 지역별 매출액
export interface RegionSales {
    region: string;
    amount?: number;
    count?: number;
};

// MARK: - 매출액 추이
export interface SalesTransition {
    label: string;
    amount: number;
    count: number;
    regionalData: RegionSales[];
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
    regionalData?: RegionSales[];
};

// MARK: - 일간 매출액 조회 응답
export interface DailySalesResponse {
    dailySales: number;
    dailyCount: number;
    regionalData?: RegionSales[];
};

// MARK: - 주간 매출액 조회 응답
export interface WeeklySalesResponse {
    weeklySales: number;
    weeklyCount: number;
    regionalData: RegionSales[];
};

// MARK: - 월간 매출액 조회 응답
export interface MonthlySalesResponse {
    monthlySales: number;
    monthlyCount: number;
    regionalData: RegionSales[];
}

// MARK: - 사용자 지정 기간 매출액 조회 요청
export interface CustomSalesRequest {
    startDate: string;
    endDate: string;
    paymentType: paymentType;
    byRegion: boolean;
};

// MARK: - 사용자 지정 기간 매출액 조회 응답
export interface CustomSalesResponse {
    totalSales: number;
    totalCount: number;
    startDate?: string;
    endDate?: string;
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
    paymentType: paymentType;
    byRegion: boolean;
};

// MARK: - 사용자 지정 기간 매출 추이 조회 응답
export interface TrendCustomResponse {
    startDate: string;
    endDate: string;
    data?: SalesTransition[];

};

// MARK: - 대학별 매출 순위 조회
export interface UniversityRanking {
    rankings: {
        universityName: string;
        amount: number;
        count: number;
        averageAmout: number;
        rank: number;
    }
}
// MARK: - 상세분석 공통 필드
interface Analysis {
    count: number;
    totalAmount: number;
    averageAmount: number;
    percentage: number;
}

// MARK: - 상세분석 공통 메타데이터
interface Amount {
    totalAmount: number;
    totalCount: number;
}

// MARK: - 결제수단 별 상세 분석

interface PaymentAnalysisItem extends Analysis {
    paymentType: string;
}

export interface PaymentAnalysis extends Amount {
    analysis: PaymentAnalysisItem[];
}


// MARK: - 성별 구매 분석
interface GenderAnalysisItem extends Analysis {
    gender: string;
}

export interface GenderAnalysis extends Amount {
    analysis: GenderAnalysisItem[];
}

// MARK: - 연령대별 구매 분석
interface AgeAnalysisItem extends Analysis {
    ageGroup: string;
}

export interface AgeAnalysis extends Amount {
    analysis: AgeAnalysisItem[];
}