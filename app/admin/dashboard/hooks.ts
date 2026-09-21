'use client';

import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/app/services/dashboard';
import { useAdminSession } from '@/shared/contexts/admin-session-context';
import type { DashboardSummaryResponse } from './types';

/**
 * Fetches dashboard summary with auto-refresh every 60s.
 * Includes selectedCountry in query key so changing country
 * triggers an automatic refetch via React Query.
 */
export function useDashboardSummary() {
  const { session } = useAdminSession();

  return useQuery<DashboardSummaryResponse>({
    queryKey: ['dashboard', 'summary', session?.selectedCountry],
    queryFn: () => dashboardService.getSummary(),
    refetchInterval: 60_000,
  });
}
