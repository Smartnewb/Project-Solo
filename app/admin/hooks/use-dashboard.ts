import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';

export const dashboardKeys = {
  all: ['admin', 'dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
  kpi: () => [...dashboardKeys.all, 'kpi'] as const,
};

// --- stats ---

export function useTotalUsersCount(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'totalUsers', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getTotalUsersCount(region, includeDeleted, useCluster),
  });
}

export function useDailySignupCount(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'dailySignup', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getDailySignupCount(region, includeDeleted, useCluster),
  });
}

export function useWeeklySignupCount(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'weeklySignup', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getWeeklySignupCount(region, includeDeleted, useCluster),
  });
}

export function useDailySignupTrend(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'dailySignupTrend', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getDailySignupTrend(region, includeDeleted, useCluster),
  });
}

export function useWeeklySignupTrend(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'weeklySignupTrend', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getWeeklySignupTrend(region, includeDeleted, useCluster),
  });
}

export function useMonthlySignupTrend(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'monthlySignupTrend', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getMonthlySignupTrend(region, includeDeleted, useCluster),
  });
}

export function useCustomPeriodSignupCount(
  startDate: string,
  endDate: string,
  region?: string,
  includeDeleted?: boolean,
  useCluster?: boolean,
) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'customPeriodSignup', { startDate, endDate, region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getCustomPeriodSignupCount(startDate, endDate, region, includeDeleted, useCluster),
    enabled: !!startDate && !!endDate,
  });
}

export function useCustomPeriodSignupTrend(
  startDate: string,
  endDate: string,
  region?: string,
  includeDeleted?: boolean,
  useCluster?: boolean,
) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'customPeriodSignupTrend', { startDate, endDate, region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getCustomPeriodSignupTrend(startDate, endDate, region, includeDeleted, useCluster),
    enabled: !!startDate && !!endDate,
  });
}

export function useGenderStats(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'gender', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getGenderStats(region, includeDeleted, useCluster),
  });
}

export function useUniversityStats(region?: string, includeDeleted?: boolean, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'university', { region, includeDeleted, useCluster }],
    queryFn: () => AdminService.stats.getUniversityStats(region, includeDeleted, useCluster),
  });
}

export function useTotalWithdrawalsCount(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'totalWithdrawals', { region, useCluster }],
    queryFn: () => AdminService.stats.getTotalWithdrawalsCount(region, useCluster),
  });
}

export function useDailyWithdrawalCount(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'dailyWithdrawal', { region, useCluster }],
    queryFn: () => AdminService.stats.getDailyWithdrawalCount(region, useCluster),
  });
}

export function useWeeklyWithdrawalCount(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'weeklyWithdrawal', { region, useCluster }],
    queryFn: () => AdminService.stats.getWeeklyWithdrawalCount(region, useCluster),
  });
}

export function useMonthlyWithdrawalCount(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'monthlyWithdrawal', { region, useCluster }],
    queryFn: () => AdminService.stats.getMonthlyWithdrawalCount(region, useCluster),
  });
}

export function useCustomPeriodWithdrawalCount(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'customPeriodWithdrawal', { startDate, endDate }],
    queryFn: () => AdminService.stats.getCustomPeriodWithdrawalCount(startDate, endDate),
    enabled: !!startDate && !!endDate,
  });
}

export function useDailyWithdrawalTrend(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'dailyWithdrawalTrend', { region, useCluster }],
    queryFn: () => AdminService.stats.getDailyWithdrawalTrend(region, useCluster),
  });
}

export function useWeeklyWithdrawalTrend(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'weeklyWithdrawalTrend', { region, useCluster }],
    queryFn: () => AdminService.stats.getWeeklyWithdrawalTrend(region, useCluster),
  });
}

export function useMonthlyWithdrawalTrend(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'monthlyWithdrawalTrend', { region, useCluster }],
    queryFn: () => AdminService.stats.getMonthlyWithdrawalTrend(region, useCluster),
  });
}

export function useCustomPeriodWithdrawalTrend(
  startDate: string,
  endDate: string,
  region?: string,
  useCluster?: boolean,
) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'customPeriodWithdrawalTrend', { startDate, endDate, region, useCluster }],
    queryFn: () => AdminService.stats.getCustomPeriodWithdrawalTrend(startDate, endDate, region, useCluster),
    enabled: !!startDate && !!endDate,
  });
}

export function useWithdrawalReasonStats(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'withdrawalReasons', { startDate, endDate }],
    queryFn: () => AdminService.stats.getWithdrawalReasonStats(startDate, endDate),
  });
}

export function useChurnRate() {
  return useQuery({
    queryKey: [...dashboardKeys.stats(), 'churnRate'],
    queryFn: () => AdminService.stats.getChurnRate(),
  });
}

// --- kpiReport ---

export function useKpiReportLatest() {
  return useQuery({
    queryKey: [...dashboardKeys.kpi(), 'latest'],
    queryFn: () => AdminService.kpiReport.getLatest(),
  });
}

export function useKpiReportByWeek(year: number, week: number) {
  return useQuery({
    queryKey: [...dashboardKeys.kpi(), 'byWeek', { year, week }],
    queryFn: () => AdminService.kpiReport.getByWeek(year, week),
    enabled: !!year && !!week,
  });
}

export function useKpiReportDefinitions() {
  return useQuery({
    queryKey: [...dashboardKeys.kpi(), 'definitions'],
    queryFn: () => AdminService.kpiReport.getDefinitions(),
  });
}

export function useGenerateKpiReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { year?: number; week?: number }) =>
      AdminService.kpiReport.generate(params.year, params.week),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: dashboardKeys.kpi() });
    },
  });
}
