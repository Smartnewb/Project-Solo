import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';

export const usersKeys = {
  all: ['admin', 'users'] as const,
  appearance: () => [...usersKeys.all, 'appearance'] as const,
  deletedFemales: () => [...usersKeys.all, 'deletedFemales'] as const,
  engagement: () => [...usersKeys.all, 'engagement'] as const,
};

// --- userAppearance (GET) ---

export function useUsersWithAppearanceGrade(params: {
  page?: number;
  limit?: number;
  gender?: 'MALE' | 'FEMALE';
  appearanceGrade?: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN';
  universityName?: string;
  minAge?: number;
  maxAge?: number;
  searchTerm?: string;
  region?: string;
  useCluster?: boolean;
  isLongTermInactive?: boolean;
  hasPreferences?: boolean;
  includeDeleted?: boolean;
  userStatus?: 'pending' | 'approved' | 'rejected';
}) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'list', params],
    queryFn: () => AdminService.userAppearance.getUsersWithAppearanceGrade(params),
  });
}

export function useUnclassifiedUsers(page: number, limit: number, region?: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'unclassified', { page, limit, region }],
    queryFn: () => AdminService.userAppearance.getUnclassifiedUsers(page, limit, region),
  });
}

export function useUniversityVerificationPendingUsers(params: {
  page?: number;
  limit?: number;
  name?: string;
  university?: string;
}) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'universityVerificationPending', params],
    queryFn: () => AdminService.userAppearance.getUniversityVerificationPendingUsers(params),
  });
}

export function useUserDetails(userId: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'details', userId],
    queryFn: () => AdminService.userAppearance.getUserDetails(userId),
    enabled: !!userId,
  });
}

export function useUserTickets(userId: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'tickets', userId],
    queryFn: () => AdminService.userAppearance.getUserTickets(userId),
    enabled: !!userId,
  });
}

export function useUserGems(userId: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'gems', userId],
    queryFn: () => AdminService.userAppearance.getUserGems(userId),
    enabled: !!userId,
  });
}

export function useAppearanceGradeStats(region?: string, useCluster?: boolean) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'stats', { region, useCluster }],
    queryFn: () => AdminService.userAppearance.getAppearanceGradeStats(region, useCluster),
  });
}

export function useDuplicatePhoneUsers() {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'duplicatePhone'],
    queryFn: () => AdminService.userAppearance.getDuplicatePhoneUsers(),
  });
}

export function useVerifiedUsers(params: {
  page?: number;
  limit?: number;
  name?: string;
  university?: string;
}) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'verified', params],
    queryFn: () => AdminService.userAppearance.getVerifiedUsers(params),
  });
}

export function useUniversityVerificationPending(params: {
  page?: number;
  limit?: number;
  name?: string;
  university?: string;
}) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'universityPending', params],
    queryFn: () => AdminService.userAppearance.getUniversityVerificationPending(params),
  });
}

export function useBlacklistUsers(region?: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'blacklist', { region }],
    queryFn: () => AdminService.userAppearance.getBlacklistUsers(region),
  });
}

export function useSearchUsersForReset(params: {
  name?: string;
  phoneNumber?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'searchForReset', params],
    queryFn: () => AdminService.userAppearance.searchUsersForReset(params),
    enabled: !!(params.name || params.phoneNumber),
  });
}

export function useReapplyUsers(page: number = 1, limit: number = 10, region?: string, name?: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'reapply', { page, limit, region, name }],
    queryFn: () => AdminService.userAppearance.getReapplyUsers(page, limit, region, name),
  });
}

export function usePendingUsers(page: number = 1, limit: number = 10, region?: string, name?: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'pending', { page, limit, region, name }],
    queryFn: () => AdminService.userAppearance.getPendingUsers(page, limit, region, name),
  });
}

export function useRejectedUsers(page: number = 1, limit: number = 10, region?: string, name?: string) {
  return useQuery({
    queryKey: [...usersKeys.appearance(), 'rejected', { page, limit, region, name }],
    queryFn: () => AdminService.userAppearance.getRejectedUsers(page, limit, region, name),
  });
}

// --- userAppearance (mutations) ---

export function useSetUserAppearanceGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN' }) =>
      AdminService.userAppearance.setUserAppearanceGrade(params.userId, params.grade),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.appearance() });
    },
  });
}

export function useBulkSetUserAppearanceGrade() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userIds: string[]; grade: 'S' | 'A' | 'B' | 'C' | 'UNKNOWN' }) =>
      AdminService.userAppearance.bulkSetUserAppearanceGrade(params.userIds, params.grade),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.appearance() });
    },
  });
}

export function useCreateUserTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; count: number }) =>
      AdminService.userAppearance.createUserTickets(params.userId, params.count),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'tickets', vars.userId] });
    },
  });
}

export function useDeleteUserTickets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; count: number }) =>
      AdminService.userAppearance.deleteUserTickets(params.userId, params.count),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'tickets', vars.userId] });
    },
  });
}

export function useAddUserGems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; amount: number }) =>
      AdminService.userAppearance.addUserGems(params.userId, params.amount),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'gems', vars.userId] });
    },
  });
}

export function useRemoveUserGems() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; amount: number }) =>
      AdminService.userAppearance.removeUserGems(params.userId, params.amount),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'gems', vars.userId] });
    },
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; profileData: any }) =>
      AdminService.userAppearance.updateUserProfile(params.userId, params.profileData),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'details', vars.userId] });
    },
  });
}

export function useUpdateAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; reason?: string }) =>
      AdminService.userAppearance.updateAccountStatus(params.userId, params.status, params.reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'details', vars.userId] });
    },
  });
}

export function useSendWarningMessage() {
  return useMutation({
    mutationFn: (params: { userId: string; message: string }) =>
      AdminService.userAppearance.sendWarningMessage(params.userId, params.message),
  });
}

export function useSendEmailNotification() {
  return useMutation({
    mutationFn: (params: { userId: string; subject: string; message: string }) =>
      AdminService.userAppearance.sendEmailNotification(params.userId, params.subject, params.message),
  });
}

export function useSendSmsNotification() {
  return useMutation({
    mutationFn: (params: { userId: string; message: string }) =>
      AdminService.userAppearance.sendSmsNotification(params.userId, params.message),
  });
}

export function useForceLogout() {
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.forceLogout(userId),
  });
}

export function useSendProfileUpdateRequest() {
  return useMutation({
    mutationFn: (params: { userId: string; message: string }) =>
      AdminService.userAppearance.sendProfileUpdateRequest(params.userId, params.message),
  });
}

export function useSetInstagramError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.setInstagramError(userId),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'details', userId] });
    },
  });
}

export function useResetInstagramError() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.resetInstagramError(userId),
    onSuccess: (_data, userId) => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'details', userId] });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; sendEmail?: boolean; addToBlacklist?: boolean }) =>
      AdminService.userAppearance.deleteUser(params.userId, params.sendEmail, params.addToBlacklist),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.appearance() });
    },
  });
}

export function useReleaseFromBlacklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.releaseFromBlacklist(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'blacklist'] });
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.resetPassword(userId),
  });
}

export function useApproveUniversityVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.approveUniversityVerification(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'universityVerificationPending'] });
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'universityPending'] });
    },
  });
}

export function useRejectUniversityVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.userAppearance.rejectUniversityVerification(userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'universityVerificationPending'] });
      qc.invalidateQueries({ queryKey: [...usersKeys.appearance(), 'universityPending'] });
    },
  });
}

export function useRevokeUserApproval() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { userId: string; revokeReason: string }) =>
      AdminService.userAppearance.revokeUserApproval(params.userId, params.revokeReason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.appearance() });
    },
  });
}

// --- deletedFemales ---

export function useDeletedFemalesList(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: [...usersKeys.deletedFemales(), 'list', { page, limit }],
    queryFn: () => AdminService.deletedFemales.getList(page, limit),
  });
}

export function useRestoreDeletedFemale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.deletedFemales.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.deletedFemales() });
    },
  });
}

export function useSleepDeletedFemale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.deletedFemales.sleep(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usersKeys.deletedFemales() });
    },
  });
}

// --- userEngagement ---

export function useUserEngagementStats(startDate?: string, endDate?: string, includeDeleted?: boolean) {
  return useQuery({
    queryKey: [...usersKeys.engagement(), 'stats', { startDate, endDate, includeDeleted }],
    queryFn: () => AdminService.userEngagement.getStats(startDate, endDate, includeDeleted),
  });
}
