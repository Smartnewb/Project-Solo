import { adminRequest } from '@/shared/lib/http/admin-fetch';

export interface RevenueSummary {
  totalRevenue: number;
  pgRevenue: number;
  iapRevenue: number;
  transactionCount: number;
  period: { start: string; end: string };
}

export interface RevenueBreakdown {
  byMethod: { method: string; amount: number; count: number }[];
  byProduct: { productName: string; amount: number; count: number }[];
}

export interface DailyRevenueTrend {
  date: string;
  revenue: number;
  pgRevenue: number;
  iapRevenue: number;
  count: number;
}

// V2 API wraps responses in { data: T } via V2ResponseInterceptor
interface V2Response<T> {
  data: T;
}

export const revenueV2 = {
  getSummary: async (startDate: string, endDate: string) => {
    const res = await adminRequest<V2Response<RevenueSummary>>(
      `/admin/v2/revenue/summary?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.data;
  },
  getBreakdown: async (startDate: string, endDate: string) => {
    const res = await adminRequest<V2Response<RevenueBreakdown>>(
      `/admin/v2/revenue/breakdown?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.data;
  },
  getDailyTrend: async (startDate: string, endDate: string) => {
    const res = await adminRequest<V2Response<DailyRevenueTrend[]>>(
      `/admin/v2/revenue/daily-trend?startDate=${startDate}&endDate=${endDate}`,
    );
    return res.data;
  },
};
