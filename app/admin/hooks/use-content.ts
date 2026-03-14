import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AdminService from '@/app/services/admin';
import type {
  BannerPosition,
  CreateBannerRequest,
  CreateCardNewsRequest,
  CreatePresetRequest,
  CreateSometimeArticleRequest,
  PublishCardNewsRequest,
  UpdateBannerOrderRequest,
  UpdateBannerRequest,
  UpdateCardNewsRequest,
  UpdateSometimeArticleRequest,
  UploadAndCreatePresetRequest,
} from '@/types/admin';
import type { AppReviewsParams } from '@/app/services/admin/content';

// Query keys
export const contentKeys = {
  all: ['admin', 'content'] as const,
  backgroundPresets: () => [...contentKeys.all, 'background-presets'] as const,
  backgroundPresetsActive: () => [...contentKeys.backgroundPresets(), 'active'] as const,
  cardNews: () => [...contentKeys.all, 'card-news'] as const,
  cardNewsList: (page: number, limit: number) => [...contentKeys.cardNews(), 'list', { page, limit }] as const,
  cardNewsDetail: (id: string) => [...contentKeys.cardNews(), 'detail', id] as const,
  cardNewsCategories: () => [...contentKeys.cardNews(), 'categories'] as const,
  banners: () => [...contentKeys.all, 'banners'] as const,
  bannerList: (position?: BannerPosition) => [...contentKeys.banners(), 'list', { position }] as const,
  sometimeArticles: () => [...contentKeys.all, 'sometime-articles'] as const,
  sometimeArticleList: (params?: object) => [...contentKeys.sometimeArticles(), 'list', params] as const,
  sometimeArticleDetail: (id: string) => [...contentKeys.sometimeArticles(), 'detail', id] as const,
  appReviews: () => [...contentKeys.all, 'app-reviews'] as const,
  appReviewList: (params: AppReviewsParams) => [...contentKeys.appReviews(), 'list', params] as const,
  appReviewStats: () => [...contentKeys.appReviews(), 'stats'] as const,
  communityReviewArticles: () => [...contentKeys.all, 'community-review-articles'] as const,
  communityReviewArticleList: (params?: object) => [...contentKeys.communityReviewArticles(), 'list', params] as const,
  publicReviews: () => [...contentKeys.all, 'public-reviews'] as const,
  publicReviewList: (params?: object) => [...contentKeys.publicReviews(), 'list', params] as const,
  featuredAppReviews: (params?: object) => [...contentKeys.publicReviews(), 'featured', params] as const,
};

// ==================== Background Presets ====================

export function useActiveBackgroundPresets() {
  return useQuery({
    queryKey: contentKeys.backgroundPresetsActive(),
    queryFn: () => AdminService.backgroundPresets.getActive(),
  });
}

export function useUploadBackgroundPreset() {
  return useMutation({
    mutationFn: (imageFile: File) => AdminService.backgroundPresets.upload(imageFile),
  });
}

export function useUploadAndCreateBackgroundPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageFile, data }: { imageFile: File; data: UploadAndCreatePresetRequest }) =>
      AdminService.backgroundPresets.uploadAndCreate(imageFile, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.backgroundPresets() });
    },
  });
}

export function useCreateBackgroundPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePresetRequest) => AdminService.backgroundPresets.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.backgroundPresets() });
    },
  });
}

export function useUpdateBackgroundPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePresetRequest> }) =>
      AdminService.backgroundPresets.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.backgroundPresets() });
    },
  });
}

export function useDeleteBackgroundPreset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.backgroundPresets.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.backgroundPresets() });
    },
  });
}

// ==================== Card News ====================

export function useCardNewsList(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: contentKeys.cardNewsList(page, limit),
    queryFn: () => AdminService.cardNews.getList(page, limit),
  });
}

export function useCardNewsDetail(id: string) {
  return useQuery({
    queryKey: contentKeys.cardNewsDetail(id),
    queryFn: () => AdminService.cardNews.get(id),
    enabled: !!id,
  });
}

export function useCardNewsCategories() {
  return useQuery({
    queryKey: contentKeys.cardNewsCategories(),
    queryFn: () => AdminService.cardNews.getCategories(),
  });
}

export function useUploadCardNewsSectionImage() {
  return useMutation({
    mutationFn: (imageFile: File) => AdminService.cardNews.uploadSectionImage(imageFile),
  });
}

export function useCreateCardNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCardNewsRequest) => AdminService.cardNews.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNews() });
    },
  });
}

export function useUpdateCardNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCardNewsRequest }) =>
      AdminService.cardNews.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNews() });
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNewsDetail(id) });
    },
  });
}

export function useDeleteCardNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.cardNews.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNews() });
    },
  });
}

export function usePublishCardNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data?: PublishCardNewsRequest }) =>
      AdminService.cardNews.publish(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNews() });
      queryClient.invalidateQueries({ queryKey: contentKeys.cardNewsDetail(id) });
    },
  });
}

// ==================== Banners ====================

export function useBannerList(position?: BannerPosition) {
  return useQuery({
    queryKey: contentKeys.bannerList(position),
    queryFn: () => AdminService.banners.getList(position),
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ imageFile, data }: { imageFile: File; data: CreateBannerRequest }) =>
      AdminService.banners.create(imageFile, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.banners() });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBannerRequest }) =>
      AdminService.banners.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.banners() });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.banners.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.banners() });
    },
  });
}

export function useUpdateBannerOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBannerOrderRequest) => AdminService.banners.updateOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.banners() });
    },
  });
}

// ==================== Sometime Articles ====================

export function useSometimeArticleList(params?: {
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: contentKeys.sometimeArticleList(params),
    queryFn: () => AdminService.sometimeArticles.getList(params),
  });
}

export function useSometimeArticleDetail(id: string) {
  return useQuery({
    queryKey: contentKeys.sometimeArticleDetail(id),
    queryFn: () => AdminService.sometimeArticles.get(id),
    enabled: !!id,
  });
}

export function useUploadSometimeArticleImage() {
  return useMutation({
    mutationFn: (imageFile: File) => AdminService.sometimeArticles.uploadImage(imageFile),
  });
}

export function useCreateSometimeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSometimeArticleRequest) => AdminService.sometimeArticles.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.sometimeArticles() });
    },
  });
}

export function useUpdateSometimeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSometimeArticleRequest }) =>
      AdminService.sometimeArticles.update(id, data),
    onSuccess: (_result, { id }) => {
      queryClient.invalidateQueries({ queryKey: contentKeys.sometimeArticles() });
      queryClient.invalidateQueries({ queryKey: contentKeys.sometimeArticleDetail(id) });
    },
  });
}

export function useDeleteSometimeArticle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AdminService.sometimeArticles.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.sometimeArticles() });
    },
  });
}

// ==================== App Reviews ====================

export function useAppReviewList(params: AppReviewsParams = {}) {
  return useQuery({
    queryKey: contentKeys.appReviewList(params),
    queryFn: () => AdminService.appReviews.getList(params),
  });
}

export function useAppReviewStats() {
  return useQuery({
    queryKey: contentKeys.appReviewStats(),
    queryFn: () => AdminService.appReviews.getStats(),
  });
}

export function useToggleAppReviewFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pk: string) => AdminService.appReviews.toggleFeatured(pk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.appReviews() });
    },
  });
}

// ==================== Community Review Articles ====================

export function useCommunityReviewArticleList(params: { limit?: number; cursor?: string } = {}) {
  return useQuery({
    queryKey: contentKeys.communityReviewArticleList(params),
    queryFn: () => AdminService.communityReviewArticles.getList(params),
  });
}

export function useToggleCommunityReviewArticleFeatured() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => AdminService.communityReviewArticles.toggleFeatured(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contentKeys.communityReviewArticles() });
    },
  });
}

// ==================== Public Reviews ====================

export function usePublicReviewList(params: { type?: 'app' | 'community' | 'inapp' | 'hot' | 'review'; limit?: number } = {}) {
  return useQuery({
    queryKey: contentKeys.publicReviewList(params),
    queryFn: () => AdminService.publicReviews.getList(params),
  });
}

export function useFeaturedAppReviews(params: { store?: 'APP_STORE' | 'PLAY_STORE'; limit?: number; cursor?: string } = {}) {
  return useQuery({
    queryKey: contentKeys.featuredAppReviews(params),
    queryFn: () => AdminService.publicReviews.getFeaturedAppReviews(params),
  });
}
