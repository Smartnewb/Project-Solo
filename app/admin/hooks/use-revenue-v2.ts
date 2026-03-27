import { useQuery } from '@tanstack/react-query';
import { revenueV2 } from '@/app/services/admin/revenue-v2';

export const revenueV2Keys = {
  all: ['admin', 'revenue-v2'] as const,
  summary: (startDate: string, endDate: string) =>
    [...revenueV2Keys.all, 'summary', startDate, endDate] as const,
  breakdown: (startDate: string, endDate: string) =>
    [...revenueV2Keys.all, 'breakdown', startDate, endDate] as const,
  dailyTrend: (startDate: string, endDate: string) =>
    [...revenueV2Keys.all, 'daily-trend', startDate, endDate] as const,
};

export function useRevenueSummary(startDate: string, endDate: string) {
  return useQuery({
    queryKey: revenueV2Keys.summary(startDate, endDate),
    queryFn: () => revenueV2.getSummary(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useRevenueBreakdown(startDate: string, endDate: string) {
  return useQuery({
    queryKey: revenueV2Keys.breakdown(startDate, endDate),
    queryFn: () => revenueV2.getBreakdown(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useRevenueDailyTrend(startDate: string, endDate: string) {
  return useQuery({
    queryKey: revenueV2Keys.dailyTrend(startDate, endDate),
    queryFn: () => revenueV2.getDailyTrend(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}
