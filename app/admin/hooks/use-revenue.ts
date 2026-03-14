import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { AdminLikesParams, AppleRefundListParams, ProcessLikesRequest, ProcessRefundRequest, RefundPreviewRequest, ViewProfileRequest } from '@/types/admin';

export const revenueKeys = {
  all: ['admin', 'revenue'] as const,
  gems: () => [...revenueKeys.all, 'gems'] as const,
  gemPricing: () => [...revenueKeys.all, 'gemPricing'] as const,
  femaleRetention: () => [...revenueKeys.all, 'femaleRetention'] as const,
  chatRefund: () => [...revenueKeys.all, 'chatRefund'] as const,
  appleRefund: () => [...revenueKeys.all, 'appleRefund'] as const,
  likes: () => [...revenueKeys.all, 'likes'] as const,
  dormantLikes: () => [...revenueKeys.all, 'dormantLikes'] as const,
};

// --- gems ---

export function useBulkGrantGems() {
  return useMutation({
    mutationFn: (data: { phoneNumbers?: string[]; csvFile?: File; gemAmount: number; message: string }) =>
      AdminService.gems.bulkGrant(data),
  });
}

// --- gemPricing ---

export function useGemPricingList() {
  return useQuery({
    queryKey: [...revenueKeys.gemPricing(), 'all'],
    queryFn: () => AdminService.gemPricing.getAll(),
  });
}

// --- femaleRetention ---

export function useFemaleRetentionInactiveUsers(limit: number = 20, offset: number = 0) {
  return useQuery({
    queryKey: [...revenueKeys.femaleRetention(), 'inactive', { limit, offset }],
    queryFn: () => AdminService.femaleRetention.getInactiveUsers(limit, offset),
  });
}

export function useIssueTemporaryPassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.femaleRetention.issueTemporaryPassword(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.femaleRetention() });
    },
  });
}

// --- chatRefund ---

export function useChatRefundSearchUsers(name: string) {
  return useQuery({
    queryKey: [...revenueKeys.chatRefund(), 'searchUsers', { name }],
    queryFn: () => AdminService.chatRefund.searchUsers(name),
    enabled: !!name,
  });
}

export function useChatRefundEligibleRooms(userId: string) {
  return useQuery({
    queryKey: [...revenueKeys.chatRefund(), 'eligibleRooms', { userId }],
    queryFn: () => AdminService.chatRefund.getEligibleRooms(userId),
    enabled: !!userId,
  });
}

export function usePreviewChatRefund() {
  return useMutation({
    mutationFn: (data: RefundPreviewRequest) => AdminService.chatRefund.previewRefund(data),
  });
}

export function useProcessChatRefund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProcessRefundRequest) => AdminService.chatRefund.processRefund(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.chatRefund() });
    },
  });
}

// --- appleRefund ---

export function useAppleRefundList(params: AppleRefundListParams = {}) {
  return useQuery({
    queryKey: [...revenueKeys.appleRefund(), 'list', params],
    queryFn: () => AdminService.appleRefund.getList(params),
  });
}

export function useAppleRefundDetail(id: string) {
  return useQuery({
    queryKey: [...revenueKeys.appleRefund(), 'detail', { id }],
    queryFn: () => AdminService.appleRefund.getDetail(id),
    enabled: !!id,
  });
}

export function useSyncAppleRefundStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => AdminService.appleRefund.syncRefundStatus(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.appleRefund() });
    },
  });
}

// --- likes ---

export function useLikesList(params: AdminLikesParams) {
  return useQuery({
    queryKey: [...revenueKeys.likes(), 'list', params],
    queryFn: () => AdminService.likes.getList(params),
  });
}

// --- dormantLikes ---

export function useDormantLikesDashboard(page: number = 1, limit: number = 20, inactiveDays: number = 0) {
  return useQuery({
    queryKey: [...revenueKeys.dormantLikes(), 'dashboard', { page, limit, inactiveDays }],
    queryFn: () => AdminService.dormantLikes.getDashboard(page, limit, inactiveDays),
  });
}

export function useDormantLikesPending(userId: string) {
  return useQuery({
    queryKey: [...revenueKeys.dormantLikes(), 'pending', { userId }],
    queryFn: () => AdminService.dormantLikes.getPendingLikes(userId),
    enabled: !!userId,
  });
}

export function useDormantLikesCooldownStatus(userId: string) {
  return useQuery({
    queryKey: [...revenueKeys.dormantLikes(), 'cooldown', { userId }],
    queryFn: () => AdminService.dormantLikes.getCooldownStatus(userId),
    enabled: !!userId,
  });
}

export function useProcessDormantLikes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProcessLikesRequest) => AdminService.dormantLikes.processLikes(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: revenueKeys.dormantLikes() });
    },
  });
}

export function useDormantLikesActionLogs(
  page: number = 1,
  limit: number = 20,
  filters?: { adminUserId?: string; dormantUserId?: string; batchId?: string },
) {
  return useQuery({
    queryKey: [...revenueKeys.dormantLikes(), 'logs', { page, limit, ...filters }],
    queryFn: () => AdminService.dormantLikes.getActionLogs(page, limit, filters),
  });
}

export function useViewDormantLikeProfile() {
  return useMutation({
    mutationFn: (data: ViewProfileRequest) => AdminService.dormantLikes.viewProfile(data),
  });
}
