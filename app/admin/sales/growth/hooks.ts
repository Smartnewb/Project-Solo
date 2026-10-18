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

export const HISTORY_MONTHS = 13;

export function useGrowthRange() {
  const today = kstToday();
  return {
    today,
    from: monthStart(addMonths(today, -(HISTORY_MONTHS - 1))),
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

export function useMonthlySignups() {
  return useQuery({
    queryKey: ["sales-growth", "signups", "monthly"],
    queryFn: async () => {
      const raw = await stats.getMonthlySignupTrend();
      const rows: Array<{ month: string; count: number }> = Array.isArray(raw?.data) ? raw.data : [];
      return rows;
    },
  });
}
