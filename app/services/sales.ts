// TITLE: - 어드민 매출 지표 서비스 레이어
import axiosServer from "@/utils/axios";


// MARK: - 엔드포인트
const SALES_ENDPOINT = {
    TOTAL: '/admin/stats/sales/total',
    DAILY: '/admin/stats/sales/daily',
    WEEKLY: '/admin/stats/sales/total',
    MONTHLY: '/admin/stats/sales/mothly',
    CUSTOM_PERIOD: '/admin/stats/sales/custom-period',
    TREND_DAILY: '/admin/stats/sales/trend/daily',
    TREND_WEEKLY: '/admin/stats/sales/trend/weekly',
    TREND_MONTHLY: '/admin/stats/sales/trend/monthly',
    TREND_CUSTOM: '/admin/stats/sales/trend/custom-period',
    SUCCESS_RATE: '/admin/stats/sales/success-rate',
} as const;