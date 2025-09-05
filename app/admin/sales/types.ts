// TITLE: - 어드민 매출 지표 관련 타입 정의

import { WeekNumberLabel } from "react-day-picker";

// === 타입 ===
type paymentType = 'all' | 'iap_only' | 'exclude_iap';

// === 도메인 엔티티 ===
// MARK: - 지역별 매출액
export interface RegionSales {
    regiond: string;
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



// === API 모델 ===
// MARK: - 총 매출액 조회 응답
export interface TotalSalesResponse {
    totalSales: number;
    totalCount: number;
    regionalData?: RegionSales[];
};

// MARK: - 일간 매출액 조회 응답
export interface DailySalesResponse {
    dialySales: number;
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

// MARK: - 결제 성공률 조회
export interface SuccessRateResponse {
    date: string;
    totalAttemps: number;
    successFulPayments: number;
    successRate: number;
};