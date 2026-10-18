"use client";

import { useQuery } from "@tanstack/react-query";
import { revenueV2 } from "@/app/services/admin/revenue-v2";
import { stats } from "@/app/services/admin/dashboard";
import { salesService } from "@/app/services/sales";
import {
  addDays,
  addMonths,
  fillDaily,
  kstMidnightIso,
  kstToday,
  monthStart,
  type DailyPoint,
} from "./lib/metrics";

export const HISTORY_START = "2025-05-01";

export function useGrowthRange() {
  const today = kstToday();
  return {
    today,
    from: HISTORY_START,
    to: today,
  };
}

export function useDailyRevenue() {
  const { from, to } = useGrowthRange();
  return useQuery<DailyPoint[]>({
    queryKey: ["sales-growth", "daily", from, to],
    queryFn: async () => {
      const rows = await revenueV2.getDailyTrend(kstMidnightIso(from), kstMidnightIso(addDays(to, 1)));
      return fillDaily(rows ?? [], from, to);
    },
  });
}

export function useMethodBreakdown(month: string) {
  const from = monthStart(month);
  const to = addMonths(month, 1);
  return useQuery({
    queryKey: ["sales-growth", "breakdown", from],
    queryFn: () => revenueV2.getBreakdown(kstMidnightIso(from), kstMidnightIso(to)),
  });
}

export function useMonthlyRevenueMetrics() {
  const { from, to } = useGrowthRange();
  return useQuery({
    queryKey: ["sales-growth", "metrics-trend", "monthly", from, to],
    queryFn: () =>
      salesService.getRevenueMetricsTrend({ startDate: monthStart(from), endDate: to, granularity: "monthly" }),
  });
}

export function useRepurchase() {
  return useQuery({
    queryKey: ["sales-growth", "repurchase"],
    queryFn: () => salesService.getRepurchaseAnalysis(),
  });
}

export function useLtvCohorts() {
  return useQuery({
    queryKey: ["sales-growth", "ltv"],
    queryFn: () => salesService.getLtvAnalysis(),
  });
}

export const BEHAVIOR_WINDOW_DAYS = 90;

export function useBehaviorRange() {
  const today = kstToday();
  return { today, startDate: addDays(today, -(BEHAVIOR_WINDOW_DAYS - 1)), endDate: today };
}

export function useFeatureFunnel() {
  const range = useBehaviorRange();
  return useQuery({
    queryKey: ["sales-behavior", "feature-funnel", range.startDate, range.endDate],
    queryFn: () => salesService.getFeatureFunnel({ startDate: range.startDate, endDate: range.endDate }),
  });
}

export function useGemTrigger() {
  const range = useBehaviorRange();
  return useQuery({
    queryKey: ["sales-behavior", "gem-trigger", range.startDate, range.endDate],
    queryFn: () => salesService.getGemTrigger({ startDate: range.startDate, endDate: range.endDate }),
  });
}

export function useFirstPurchase() {
  return useQuery({
    queryKey: ["sales-behavior", "first-purchase"],
    queryFn: () => salesService.getFirstPurchase(),
  });
}

export function useGemConsumption() {
  const range = useBehaviorRange();
  return useQuery({
    queryKey: ["sales-behavior", "gem-consumption", range.startDate, range.endDate],
    queryFn: () => salesService.getGemConsumption({ startDate: range.startDate, endDate: range.endDate }),
  });
}

export function useGemEconomy() {
  const range = useBehaviorRange();
  return useQuery({
    queryKey: ["sales-behavior", "gem-economy", range.startDate, range.endDate],
    queryFn: () => salesService.getGemEconomy({ startDate: range.startDate, endDate: range.endDate }),
  });
}

export function useWhaleUsers() {
  return useQuery({
    queryKey: ["sales-behavior", "whale-users"],
    queryFn: () => salesService.getWhaleUsers(),
  });
}

export function useProductSales(month: string) {
  const from = monthStart(month);
  const to = addDays(addMonths(month, 1), -1);
  return useQuery({
    queryKey: ["sales-behavior", "product-sales", from],
    queryFn: () => salesService.getProductSales({ startDate: from, endDate: to }),
  });
}

export function useMonthlySignups() {
  return useQuery({
    queryKey: ["sales-growth", "signups", "monthly", HISTORY_START],
    queryFn: async () => {
      const raw = await stats.getMonthlySignupTrend(undefined, undefined, undefined, HISTORY_START);
      const rows: Array<{ month: string; count: number }> = Array.isArray(raw?.data) ? raw.data : [];
      return rows;
    },
  });
}
