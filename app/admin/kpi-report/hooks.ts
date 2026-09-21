// app/admin/kpi-report/hooks.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { KpiReport } from './types';

/**
 * Fetch the most recent KPI report.
 * Used on initial page load to determine which week to display.
 */
export function useKpiReportLatest(options?: { enabled?: boolean }) {
  return useQuery<KpiReport>({
    queryKey: ['kpi-report', 'latest'],
    queryFn: () => AdminService.kpiReport.getLatest(),
    enabled: options?.enabled,
    retry: (failureCount, error) => {
      // Don't retry 404 (no report exists yet)
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Fetch a KPI report for a specific year/week.
 * Used after the user navigates to a different week.
 */
export function useKpiReportByWeek(
  year: number,
  week: number,
  options?: { enabled?: boolean },
) {
  return useQuery<KpiReport>({
    queryKey: ['kpi-report', year, week],
    queryFn: () => AdminService.kpiReport.getByWeek(year, week),
    enabled: options?.enabled ?? true,
    retry: (failureCount, error) => {
      if ((error as any)?.response?.status === 404) return false;
      return failureCount < 1;
    },
  });
}

/**
 * Generate a KPI report for a given year/week.
 * On success: caches the result and invalidates the latest query.
 */
export function useGenerateKpiReport() {
  const queryClient = useQueryClient();

  return useMutation<KpiReport, Error, { year: number; week: number }>({
    mutationFn: ({ year, week }) =>
      AdminService.kpiReport.generate(year, week),
    onSuccess: (data, { year, week }) => {
      queryClient.setQueryData(['kpi-report', year, week], data);
      queryClient.invalidateQueries({ queryKey: ['kpi-report', 'latest'] });
    },
  });
}
