import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type { PendingUsersFilter, ReviewHistoryFilter } from '@/app/services/admin';

// Query keys
export const moderationKeys = {
  all: ['admin', 'moderation'] as const,
  reports: () => [...moderationKeys.all, 'reports'] as const,
  profileReports: (params: URLSearchParams) => [...moderationKeys.reports(), 'profile', params.toString()] as const,
  profileReportDetail: (reportId: string) => [...moderationKeys.reports(), 'profile', 'detail', reportId] as const,
  chatHistory: (chatRoomId: string, page: number, limit: number) =>
    [...moderationKeys.reports(), 'chat-history', chatRoomId, { page, limit }] as const,
  userProfileImages: (userId: string) => [...moderationKeys.reports(), 'user-profile-images', userId] as const,
  userReview: () => [...moderationKeys.all, 'user-review'] as const,
  pendingUsers: (page: number, limit: number, search?: string, filters?: PendingUsersFilter, excludeUserIds?: string[]) =>
    [...moderationKeys.userReview(), 'pending', { page, limit, search, filters, excludeUserIds }] as const,
  userDetail: (userId: string) => [...moderationKeys.userReview(), 'detail', userId] as const,
  imageValidation: (imageId: string) => [...moderationKeys.userReview(), 'image-validation', imageId] as const,
  reviewHistory: (filters: ReviewHistoryFilter) => [...moderationKeys.userReview(), 'review-history', filters] as const,
  profileImages: () => [...moderationKeys.all, 'profile-images'] as const,
  pendingProfileImages: () => [...moderationKeys.profileImages(), 'pending'] as const,
};

// ==================== Reports ====================

export function useProfileReports(params: URLSearchParams) {
  return useQuery({
    queryKey: moderationKeys.profileReports(params),
    queryFn: () => AdminService.reports.getProfileReports(params),
  });
}

export function useProfileReportDetail(reportId: string) {
  return useQuery({
    queryKey: moderationKeys.profileReportDetail(reportId),
    queryFn: () => AdminService.reports.getProfileReportDetail(reportId),
    enabled: !!reportId,
  });
}

export function useUpdateReportStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      status,
      adminMemo,
    }: {
      reportId: string;
      status: 'pending' | 'reviewing' | 'resolved' | 'rejected';
      adminMemo?: string;
    }) => AdminService.reports.updateReportStatus(reportId, status, adminMemo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.reports() });
    },
  });
}

export function useChatHistory(chatRoomId: string, page: number = 1, limit: number = 50) {
  return useQuery({
    queryKey: moderationKeys.chatHistory(chatRoomId, page, limit),
    queryFn: () => AdminService.reports.getChatHistory(chatRoomId, page, limit),
    enabled: !!chatRoomId,
  });
}

export function useUserProfileImages(userId: string) {
  return useQuery({
    queryKey: moderationKeys.userProfileImages(userId),
    queryFn: () => AdminService.reports.getUserProfileImages(userId),
    enabled: !!userId,
  });
}

// ==================== User Review ====================

export function usePendingUsers(
  page: number = 1,
  limit: number = 20,
  search?: string,
  filters?: PendingUsersFilter,
  excludeUserIds?: string[],
) {
  return useQuery({
    queryKey: moderationKeys.pendingUsers(page, limit, search, filters, excludeUserIds),
    queryFn: () => AdminService.userReview.getPendingUsers(page, limit, search, filters, excludeUserIds),
  });
}

export function useUserReviewDetail(userId: string) {
  return useQuery({
    queryKey: moderationKeys.userDetail(userId),
    queryFn: () => AdminService.userReview.getUserDetail(userId),
    enabled: !!userId,
  });
}

export function useApproveUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userReview.approveUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.userReview() });
    },
  });
}

export function useRejectUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, category, reason }: { userId: string; category: string; reason: string }) =>
      AdminService.userReview.rejectUser(userId, category, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.userReview() });
    },
  });
}

export function useBulkRejectUsers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userIds,
      category,
      reason,
      onProgress,
    }: {
      userIds: string[];
      category: string;
      reason: string;
      onProgress?: (current: number, total: number) => void;
    }) => AdminService.userReview.bulkRejectUsers(userIds, category, reason, onProgress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.userReview() });
    },
  });
}

export function useUpdateUserRank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      rank,
      emitEvent,
    }: {
      userId: string;
      rank: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
      emitEvent?: boolean;
    }) => AdminService.userReview.updateUserRank(userId, rank, emitEvent),
    onSuccess: (_result, { userId }) => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.userReview() });
      queryClient.invalidateQueries({ queryKey: moderationKeys.userDetail(userId) });
    },
  });
}

export function useImageValidation(imageId: string) {
  return useQuery({
    queryKey: moderationKeys.imageValidation(imageId),
    queryFn: () => AdminService.userReview.getImageValidation(imageId),
    enabled: !!imageId,
  });
}

export function useReviewHistory(filters: ReviewHistoryFilter = {}) {
  return useQuery({
    queryKey: moderationKeys.reviewHistory(filters),
    queryFn: () => AdminService.userReview.getReviewHistory(filters),
  });
}

// ==================== Profile Images ====================

export function usePendingProfileImages() {
  return useQuery({
    queryKey: moderationKeys.pendingProfileImages(),
    queryFn: () => AdminService.profileImages.getPendingProfileImages(),
  });
}

export function useApproveProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.profileImages.approveProfileImage(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.profileImages() });
    },
  });
}

export function useRejectProfileImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, rejectionReason }: { userId: string; rejectionReason: string }) =>
      AdminService.profileImages.rejectProfileImage(userId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.profileImages() });
    },
  });
}

export function useApproveIndividualImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (imageId: string) => AdminService.profileImages.approveIndividualImage(imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.profileImages() });
    },
  });
}

export function useRejectIndividualImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageId, rejectionReason }: { imageId: string; rejectionReason: string }) =>
      AdminService.profileImages.rejectIndividualImage(imageId, rejectionReason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.profileImages() });
    },
  });
}

export function useSetMainImage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, imageId }: { userId: string; imageId: string }) =>
      AdminService.profileImages.setMainImage(userId, imageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: moderationKeys.profileImages() });
    },
  });
}
