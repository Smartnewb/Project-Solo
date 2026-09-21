'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import AdminService, { PendingUsersFilter } from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

export function usePendingUsers(
  page: number,
  limit: number,
  search?: string,
  filters?: PendingUsersFilter,
  excludeUserIds?: string[],
) {
  const { session } = useAdminSession();
  const selectedCountry = session?.selectedCountry ?? '';

  return useQuery({
    queryKey: ['admin', 'profile-review', 'pending', { page, limit, search, filters, excludeUserIds, selectedCountry }],
    queryFn: () => AdminService.userReview.getPendingUsers(page, limit, search, filters, excludeUserIds),
    placeholderData: (prev: any) => prev,
  });
}

export function useApproveUser() {
  return useMutation({
    mutationFn: (userId: string) => AdminService.userReview.approveUser(userId),
  });
}

export function useRejectUser() {
  return useMutation({
    mutationFn: ({ userId, category, reason }: { userId: string; category: string; reason: string }) =>
      AdminService.userReview.rejectUser(userId, category, reason),
  });
}
