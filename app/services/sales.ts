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
} from "../admin/sales/types";
import { paymentType } from '@/app/admin/sales/types';
import { da } from "date-fns/locale";
import { University } from "../admin/users/appearance/types";

// MARK: - 엔드포인트
const SALES_ENDPOINT = {
    TOTAL: '/admin/stats/sales/total',
    DAILY: '/admin/stats/sales/daily',
    WEEKLY: '/admin/stats/sales/weekly',
    MONTHLY: '/admin/stats/sales/monthly',
    CUSTOM_PERIOD: '/admin/stats/sales/custom-period',
    TREND_DAILY: '/admin/stats/sales/trend/daily',
    TREND_WEEKLY: '/admin/stats/sales/trend/weekly',
    TREND_MONTHLY: '/admin/stats/sales/trend/monthly',
    TREND_CUSTOM: '/admin/stats/sales/trend/custom-period',
    UNIVERSITY_RANKING: '/admin/stats/sales/university-ranking',
    PAYMENT_ANALYSIS: '/admin/stats/sales/university-ranking',
    GENDER_ANALYSIS: '/admin/stats/sales/gender-analysis',
    AGE_ANALYSIS: '/admin/stats/sales/age-analysis',
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
    async getSalesTotal(data: GetSales) : Promise<TotalSalesResponse> {
        try {
            const response = await 
            axiosServer.get(SALES_ENDPOINT.TOTAL , {
                    params: data,
                }
            );
            return response.data;
        } catch(error) {
            throw new SalesApiError('총 매출액 조회 실패:',error);
        }
    },

    // MARK: - 일간 매출액 조회
    async getSalesDaily (data: GetSales): Promise<DailySalesResponse> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.DAILY, {
                params: data,
            });
            
            return response.data;
        } catch(error) {
            throw new SalesApiError('일간 매출액 조회 실패:',error);
        }
    },

    // MARK: - 주간 매출액 조회
    async getSalesWeekly (data: GetSales): Promise<WeeklySalesResponse> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.WEEKLY, {
                params: data,
            });

            return response.data;
        } catch(error) {
            throw new SalesApiError('주간 매출액 조회 실패:', error);
        }
    },

    // MARK: - 월간 매출액 조회
    async getSalesMonthly(data: GetSales): Promise<MonthlySalesResponse> {
        try {
            const reponse = await axiosServer.get(SALES_ENDPOINT.TREND_MONTHLY, { params: data,})
            return reponse.data;
        } catch(error) {
            throw new SalesApiError('월간 매출액 조회', error);
        }
    },

    // MARK: - 사용자 지정 기간 매출액 조회
    async getSalesCustom(data: CustomSalesRequest): Promise<CustomSalesResponse> {
        try {
            const response = await axiosServer.post(SALES_ENDPOINT.CUSTOM_PERIOD, data);
            return response.data;
        } catch(error) {
            throw new SalesApiError('사용자 지정 매출액 조회 실패:',error);
        }
    },

    // MARK: - 일별 매출 추이 조회
    async getTrendDaily(data: GetSales): Promise<TrendDailyResponse> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.TREND_DAILY, { params: data, });
            return response.data;
        } catch(error) {
            throw new SalesApiError('일별 매출 추이 조회 실패:',error);
        }
    },

    // MARK: - 주별 매출 추이 조회
    async getTrendWeekly(data: GetSales): Promise<TrendWeeklyResponse> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.TREND_WEEKLY, { params: data, });
            return response.data;
        } catch(error) {
            throw new SalesApiError('주별 매출 추이 조회 실패:',error);
        }
    },

    // MARK: - 월별 매출 추이 조회
    async getTrendMonthly(data: GetSales): Promise<TrendMonthlyResponse> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.TREND_MONTHLY, { params: data, });
            return response.data;
        } catch(error) {
            throw new SalesApiError('월별 매출 추이 조회 실패:',error);
        }
    },

    // MARK: - 사용자 지정 기간 매출 추이 조회
    async getTrendCustom(data: TrendCustomRequest): Promise<TrendCustomResponse> {
        try {
            const response = await axiosServer.post(SALES_ENDPOINT.TREND_CUSTOM, data);
            return response.data;
        } catch(error) {
            throw new SalesApiError('사용자 지정 매출액 조회 실패:',error);
        }
    },

    // MARK: - 대학별 매출 순위 조회
    async getUniversityRank(data: GetAnalysis): Promise<UniversityRanking> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.UNIVERSITY_RANKING, { params: data});
            return response.data;
        } catch(error) {
            throw new SalesApiError('대학별 매출 순위 조회 실패:',error);
        }
    },

    // MARK: - 결제수단별 상세 분석
    async getPaymentAnalysis(data: {
        startDate: string,
        endDate: string,
    }): Promise<PaymentAnalysis> {
        try {
            const response = await axiosServer.get(
                SALES_ENDPOINT.PAYMENT_ANALYSIS,
                { params: {
                    startDate: data.startDate,
                    endDate: data.endDate,
            }});
            return response.data;
        } catch(error) {
            throw new SalesApiError('결제수단별 상세 분석 조회 실패:',error);
        }
    },

    // MARK: - 성별 구매 분석
    async getGenderAnalysis(data: GetAnalysis): Promise<GenderAnalysis> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.GENDER_ANALYSIS, { params: data});
            return response.data;
        } catch(error) {
            throw new SalesApiError('성별 구매 분석 조회 실패:',error);
        }
    },

    // MARK: - 연령대별 구매 분석
    async getAgeAnalysis(data: GetAnalysis): Promise<AgeAnalysis> {
        try {
            const response = await axiosServer.get(SALES_ENDPOINT.AGE_ANALYSIS, { params: data});
            return response.data;
        } catch(error) {
            throw new SalesApiError('연령대별 구매 분석 조회 실패:',error);
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
        
        this.name = 'SalesApiError';
        this.originalError = originalError;

        if (originalError?.response) {
            this.statusCode = originalError.response.status;
            this.details = originalError.response.data;
        }
    }
};





