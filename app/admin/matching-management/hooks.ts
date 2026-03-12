'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import axiosServer from '@/utils/axios';
import AdminService from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

export function useRestMembers(params: {
  date?: string; gender?: string; page?: number; limit?: number;
}, options?: { enabled?: boolean }) {
  const { session } = useAdminSession();
  return useQuery({
    queryKey: ['matching', 'rest-members', params, session?.selectedCountry],
    queryFn: async () => {
      const response = await axiosServer.get('/admin/matching/rest-members', { params });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: (prev: any) => prev,
  });
}

export function useMatchHistory(
  startDate: string, endDate: string, page: number, limit: number,
  name?: string, type?: string, options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();
  return useQuery({
    queryKey: ['matching', 'history', startDate, endDate, page, limit, name, type, session?.selectedCountry],
    queryFn: () => AdminService.matching.getMatchHistory(startDate, endDate, page, limit, name, type),
    enabled: options?.enabled ?? true,
    placeholderData: (prev: any) => prev,
  });
}

export function useFailureLogs(
  date: string, page: number, limit: number,
  name?: string, options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();
  return useQuery({
    queryKey: ['matching', 'failure-logs', date, page, limit, name, session?.selectedCountry],
    queryFn: () => AdminService.matching.getFailureLogs(date, page, limit, name),
    enabled: options?.enabled ?? true,
    placeholderData: (prev: any) => prev,
  });
}

export function useUnmatchedUsers(params: {
  date?: string; gender?: string; page?: number; limit?: number;
}, options?: { enabled?: boolean }) {
  const { session } = useAdminSession();
  return useQuery({
    queryKey: ['matching', 'unmatched-users', params, session?.selectedCountry],
    queryFn: async () => {
      const response = await axiosServer.get('/admin/matching/unmatched-users', { params });
      return response.data;
    },
    enabled: options?.enabled ?? true,
    placeholderData: (prev: any) => prev,
  });
}

export function useCreateDirectMatch() {
  return useMutation({
    mutationFn: ({ requesterId, targetId, type }: {
      requesterId: string; targetId: string; type: 'rematching' | 'scheduled';
    }) => AdminService.matching.createDirectMatch(requesterId, targetId, type),
  });
}

export function useFindMatches() {
  return useMutation({
    mutationFn: async (data: { userId: string; options?: any }) => {
      const response = await axiosServer.post('/admin/matching/user/read', data);
      return response.data;
    },
  });
}
