import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';

export const matchingKeys = {
  all: ['admin', 'matching'] as const,
  matching: () => [...matchingKeys.all, 'matching'] as const,
  forceMatching: () => [...matchingKeys.all, 'forceMatching'] as const,
};

// --- matching (GET) ---

export function useMatchHistory(
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10,
  name?: string,
  type?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'history', { startDate, endDate, page, limit, name, type }],
    queryFn: () => AdminService.matching.getMatchHistory(startDate, endDate, page, limit, name, type),
    enabled: !!startDate && !!endDate,
  });
}

export function useMatchCount(myId: string, matcherId: string) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'count', { myId, matcherId }],
    queryFn: () => AdminService.matching.getMatchCount(myId, matcherId),
    enabled: !!myId && !!matcherId,
  });
}

export function useUserMatchCount(
  myId: string,
  matcherId: string,
  startDate?: string,
  endDate?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'userMatchCount', { myId, matcherId, startDate, endDate }],
    queryFn: () => AdminService.matching.getUserMatchCount(myId, matcherId, startDate, endDate),
    enabled: !!myId && !!matcherId,
  });
}

export function useMatcherHistory(
  matcherId: string,
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10,
  name?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'matcherHistory', { matcherId, startDate, endDate, page, limit, name }],
    queryFn: () => AdminService.matching.getMatcherHistory(matcherId, startDate, endDate, page, limit, name),
    enabled: !!matcherId && !!startDate && !!endDate,
  });
}

export function useFailureLogs(date: string, page: number = 1, limit: number = 10, reason?: string) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'failureLogs', { date, page, limit, reason }],
    queryFn: () => AdminService.matching.getFailureLogs(date, page, limit, reason),
    enabled: !!date,
  });
}

export function useUnmatchedUsers(
  page: number = 1,
  limit: number = 10,
  name?: string,
  gender?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'unmatched', { page, limit, name, gender }],
    queryFn: () => AdminService.matching.getUnmatchedUsers(page, limit, name, gender),
  });
}

export function useLikeHistory(
  startDate: string,
  endDate: string,
  page: number = 1,
  limit: number = 10,
  name?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'likeHistory', { startDate, endDate, page, limit, name }],
    queryFn: () => AdminService.matching.getLikeHistory(startDate, endDate, page, limit, name),
    enabled: !!startDate && !!endDate,
  });
}

export function useMatchingStats(
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
  university?: string,
) {
  return useQuery({
    queryKey: [...matchingKeys.matching(), 'stats', { period, university }],
    queryFn: () => AdminService.matching.getMatchingStats(period, university),
  });
}

// --- matching (mutations) ---

export function useFindMatches() {
  return useMutation({
    mutationFn: (params: { userId: string; options?: any }) =>
      AdminService.matching.findMatches(params.userId, params.options),
  });
}

export function useCreateDirectMatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { requesterId: string; targetId: string; type: 'rematching' | 'scheduled' }) =>
      AdminService.matching.createDirectMatch(params.requesterId, params.targetId, params.type),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchingKeys.matching() });
    },
  });
}

export function useProcessBatchMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => AdminService.matching.processBatchMatching(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchingKeys.matching() });
    },
  });
}

export function useProcessSingleMatching() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.matching.processSingleMatching(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchingKeys.matching() });
    },
  });
}

// --- forceMatching ---

export function useForceMatchingSearchUsers(params: {
  search?: string;
  gender?: 'male' | 'female';
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...matchingKeys.forceMatching(), 'searchUsers', params],
    queryFn: () => AdminService.forceMatching.searchUsers(params),
    enabled: !!(params.search || params.gender || params.status),
  });
}

export function useCreateForceChatRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { userIdA: string; userIdB: string; reason?: string }) =>
      AdminService.forceMatching.createForceChatRoom(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: matchingKeys.all });
    },
  });
}
