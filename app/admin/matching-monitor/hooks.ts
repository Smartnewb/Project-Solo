import { useQuery } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { DashboardPeriod, DashboardCountry } from './types';

export const monitorKeys = {
	all: ['admin', 'matching-monitor'] as const,
	dashboard: (period: DashboardPeriod, country: DashboardCountry) =>
		[...monitorKeys.all, 'dashboard', { period, country }] as const,
	diagnosis: (userId: string) => [...monitorKeys.all, 'diagnosis', userId] as const,
};

export function useMatchingDashboard(period: DashboardPeriod, country: DashboardCountry) {
	return useQuery({
		queryKey: monitorKeys.dashboard(period, country),
		queryFn: () => AdminService.matchingMonitor.getDashboard(period, country),
		refetchInterval: 60_000,
		staleTime: 55_000,
	});
}

export function useUserDiagnosis(userId: string) {
	return useQuery({
		queryKey: monitorKeys.diagnosis(userId),
		queryFn: () => AdminService.matchingMonitor.getUserDiagnosis(userId),
		enabled: !!userId && userId.length >= 3,
	});
}
