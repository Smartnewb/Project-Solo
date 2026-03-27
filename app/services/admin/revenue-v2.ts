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

export const revenueV2 = {
  getSummary: (startDate: string, endDate: string) =>
    adminRequest<RevenueSummary>(
      `/admin/v2/revenue/summary?startDate=${startDate}&endDate=${endDate}`,
    ),
  getBreakdown: (startDate: string, endDate: string) =>
    adminRequest<RevenueBreakdown>(
      `/admin/v2/revenue/breakdown?startDate=${startDate}&endDate=${endDate}`,
    ),
  getDailyTrend: (startDate: string, endDate: string) =>
    adminRequest<DailyRevenueTrend[]>(
      `/admin/v2/revenue/daily-trend?startDate=${startDate}&endDate=${endDate}`,
    ),
};
