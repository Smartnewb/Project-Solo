'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import { useAdminSession } from '@/shared/contexts/admin-session-context';

interface PushFilterParams {
  isDormant?: boolean;
  gender?: string;
  universities?: string[];
  regions?: string[];
  ranks?: string[];
  phoneNumber?: string;
  hasPreferences?: boolean;
}

export function useFilteredUsers(
  filters: PushFilterParams,
  page: number,
  limit: number,
  options?: { enabled?: boolean },
) {
  const { session } = useAdminSession();
  const selectedCountry = session?.selectedCountry ?? '';

  return useQuery({
    queryKey: ['admin', 'push-notifications', 'filtered-users', { filters, page, limit, selectedCountry }],
    queryFn: () => AdminService.pushNotifications.filterUsers(filters, page, limit),
    enabled: options?.enabled ?? true,
    placeholderData: (prev: any) => prev,
  });
}

export function useSendBulkNotification() {
  return useMutation({
    mutationFn: (data: { userIds: string[]; title: string; message: string }) =>
      AdminService.pushNotifications.sendBulkNotification(data),
  });
}

export function useUniversities() {
  const { session } = useAdminSession();
  const selectedCountry = session?.selectedCountry ?? '';

  return useQuery({
    queryKey: ['admin', 'universities', { selectedCountry }],
    queryFn: () => AdminService.universities.getUniversities(),
  });
}
