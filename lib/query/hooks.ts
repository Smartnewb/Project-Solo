import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApiClient } from '@/lib/api';
import { adminService } from '@/lib/services';

// 사용자 관련 쿼리 훅
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => adminService.users.getUsers(params)
  });
};

// 어드민 사용자 목록 조회 훅
export const useAdminUsers = (params: {
  page?: number;
  limit?: number;
  status?: string;
  searchTerm?: string;
  gender?: string;
  appearanceGrade?: string;
} = {}) => {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => adminService.users.getUsers(params)
  });
};

export const useUserDetails = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => adminService.users.getUserDetails(userId),
    enabled: !!userId
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: any }) =>
      adminService.users.updateUserProfile(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });
};

// 사용자 외모 등급 설정 훅
export const useSetUserAppearanceGrade = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, grade }: { userId: string; grade: string }) =>
      adminService.users.setUserAppearanceGrade(userId, grade as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['stats', 'appearance'] });
    }
  });
};

export const useUpdateAccountStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status, reason }: { userId: string; status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'; reason?: string }) =>
      adminService.users.updateAccountStatus(userId, status, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      adminService.users.deleteUser(userId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    }
  });
};

// 통계 관련 쿼리 훅
export const useAppearanceGradeStats = (options = {}) => {
  return useQuery({
    queryKey: ['stats', 'appearance'],
    queryFn: () => adminService.stats.getAppearanceGradeStats(),
    ...options
  });
};

export const useGenderStats = (options = {}) => {
  return useQuery({
    queryKey: ['stats', 'gender'],
    queryFn: () => adminService.stats.getGenderStats(),
    ...options
  });
};

export const useUniversityStats = (options = {}) => {
  return useQuery({
    queryKey: ['stats', 'universities'],
    queryFn: () => adminService.stats.getUniversityStats(),
    ...options
  });
};

export const useDashboardData = (options = {}) => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminService.stats.getDashboardData(),
    ...options
  });
};

// 커뮤니티 관련 쿼리 훅
export const useArticles = (params = {}) => {
  return useQuery({
    queryKey: ['articles', params],
    queryFn: () => adminService.community.getArticles(params)
  });
};

// 커뮤니티 게시글 목록 조회 훅
export const useCommunityArticles = (
  filter: string = 'all',
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['community-articles', filter, page, limit, startDate, endDate],
    queryFn: () => adminService.community.getArticles({
      isBlinded: filter === 'blinded' ? true : undefined,
      page,
      limit,
      startDate,
      endDate
    })
  });
};

// 휴지통 게시글 목록 조회 훅
export const useTrashArticles = (page: number = 1, limit: number = 10) => {
  return useQuery({
    queryKey: ['trash-articles', page, limit],
    queryFn: () => adminService.community.getTrashArticles(page, limit)
  });
};

// 신고 목록 조회 훅
export const useCommunityReports = (
  type: string = 'all',
  status: string = 'pending',
  page: number = 1,
  limit: number = 10
) => {
  return useQuery({
    queryKey: ['community-reports', type, status, page, limit],
    queryFn: () => adminService.community.getReports({
      type: type !== 'all' ? type : undefined,
      status: status !== 'all' ? status : undefined,
      page,
      limit
    })
  });
};

export const useArticleDetails = (articleId: string) => {
  return useQuery({
    queryKey: ['article', articleId],
    queryFn: () => adminService.community.getArticleDetail(articleId),
    enabled: !!articleId
  });
};

export const useBlindArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isBlinded, reason }: { id: string; isBlinded: boolean; reason?: string }) =>
      adminService.community.blindArticle(id, isBlinded, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['article', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['community-articles'] });
    }
  });
};

export const useDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminService.community.deleteArticle(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['community-articles'] });
      queryClient.invalidateQueries({ queryKey: ['trash-articles'] });
    }
  });
};

// 게시글 일괄 블라인드 처리 훅
export const useBulkBlindArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, isBlinded, reason }: { ids: string[]; isBlinded: boolean; reason?: string }) =>
      adminService.community.bulkBlindArticles(ids, isBlinded, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['community-articles'] });
    }
  });
};

// 게시글 일괄 삭제 훅
export const useBulkDeleteArticles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, reason }: { ids: string[]; reason?: string }) =>
      adminService.community.bulkDeleteArticles(ids, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['articles'] });
      queryClient.invalidateQueries({ queryKey: ['community-articles'] });
      queryClient.invalidateQueries({ queryKey: ['trash-articles'] });
    }
  });
};

// 게시글 복원 훅
export const useRestoreArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.community.restoreArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-articles'] });
      queryClient.invalidateQueries({ queryKey: ['community-articles'] });
    }
  });
};

// 게시글 영구 삭제 훅
export const usePermanentDeleteArticle = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => adminService.community.permanentDeleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-articles'] });
    }
  });
};

// 휴지통 비우기 훅
export const useEmptyTrash = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => adminService.community.emptyTrash(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trash-articles'] });
    }
  });
};

export const useReports = (params = {}) => {
  return useQuery({
    queryKey: ['reports', params],
    queryFn: () => adminService.community.getReports(params)
  });
};

export const useProcessReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, result, memo, blind }: { id: string; result: 'accepted' | 'rejected'; memo?: string; blind?: boolean }) =>
      adminService.community.processReport(id, result, memo, blind),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['community-reports'] });
    }
  });
};
