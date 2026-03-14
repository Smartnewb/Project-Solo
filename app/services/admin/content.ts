import axiosServer, { axiosNextGen } from '@/utils/axios';
import { adminRequest } from '@/shared/lib/http/admin-fetch';
import type {
	AdminCardNewsItem,
	AdminCardNewsListResponse,
	AdminSometimeArticleDetail,
	AdminSometimeArticleListResponse,
	BackgroundPreset,
	BackgroundPresetsResponse,
	Banner,
	BannerPosition,
	CreateBannerRequest,
	CreateCardNewsRequest,
	CreatePresetRequest,
	CreateSometimeArticleRequest,
	PublishCardNewsRequest,
	PublishCardNewsResponse,
	UpdateBannerOrderRequest,
	UpdateBannerRequest,
	UpdateCardNewsRequest,
	UpdateSometimeArticleRequest,
	UploadAndCreatePresetRequest,
	UploadImageResponse,
} from '@/types/admin';

// 배경 프리셋 관련 API
export const backgroundPresets = {
	getActive: async (): Promise<BackgroundPresetsResponse> => {
		try {
			;
			const response = await axiosNextGen.get<BackgroundPresetsResponse>(
				'/admin/background-presets/active',
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	upload: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			;
			;

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/background-presets/upload', {
				method: 'POST',
				body: formData,
			});
			;
			;
			return data;
		} catch (error: any) {
			throw error;
		}
	},

	uploadAndCreate: async (
		imageFile: File,
		data: UploadAndCreatePresetRequest,
	): Promise<BackgroundPreset> => {
		try {
			;
			;

			const formData = new FormData();
			formData.append('image', imageFile);
			formData.append('name', data.name);
			formData.append('displayName', data.displayName);
			if (data.order !== undefined) {
				formData.append('order', data.order.toString());
			}

			const responseData = await adminRequest<BackgroundPreset>('/admin/background-presets/upload-and-create', {
				method: 'POST',
				body: formData,
			});
			;
			return responseData;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (data: CreatePresetRequest): Promise<BackgroundPreset> => {
		try {
			;
			const response = await axiosNextGen.post('/admin/background-presets', data);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: Partial<CreatePresetRequest>): Promise<BackgroundPreset> => {
		try {
			;
			const response = await axiosNextGen.put(`/admin/background-presets/${id}`, data);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			;
			await axiosNextGen.delete(`/admin/background-presets/${id}`);
			;
		} catch (error: any) {
			throw error;
		}
	},
};

// 카드뉴스 관련 API
export const cardNews = {
	uploadSectionImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			;
			;

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>(
				'/admin/posts/card-news/section-images/upload',
				{
					method: 'POST',
					body: formData,
				},
			);
			;
			return data;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (data: CreateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			;
			const response = await axiosNextGen.post<AdminCardNewsItem>('/admin/posts/card-news', data);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	get: async (id: string): Promise<AdminCardNewsItem> => {
		try {
			;
			const response = await axiosNextGen.get<AdminCardNewsItem>(`/admin/posts/card-news/${id}`);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getList: async (page: number = 1, limit: number = 20): Promise<AdminCardNewsListResponse> => {
		try {
			;
			const response = await axiosNextGen.get<AdminCardNewsListResponse>('/admin/posts/card-news', {
				params: {
					page,
					limit,
				},
			});
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			;
			const response = await axiosNextGen.put<AdminCardNewsItem>(
				`/admin/posts/card-news/${id}`,
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			;
			await axiosNextGen.delete(`/admin/posts/card-news/${id}`);
			;
		} catch (error: any) {
			throw error;
		}
	},

	publish: async (id: string, data?: PublishCardNewsRequest): Promise<PublishCardNewsResponse> => {
		try {
			;
			const response = await axiosNextGen.post<PublishCardNewsResponse>(
				`/admin/posts/card-news/${id}/publish`,
				data || {},
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getCategories: async () => {
		try {
			;
			const response = await axiosNextGen.get('/articles/category/list');
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const banners = {
	getList: async (position?: BannerPosition): Promise<Banner[]> => {
		try {
			const params = position ? { position } : {};
			const response = await axiosServer.get<Banner[]>('/admin/banners', {
				params,
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (imageFile: File, data: CreateBannerRequest): Promise<Banner> => {
		try {
			const formData = new FormData();
			formData.append('image', imageFile);
			formData.append('position', data.position);
			if (data.actionUrl) formData.append('actionUrl', data.actionUrl);
			if (data.startDate) formData.append('startDate', data.startDate);
			if (data.endDate) formData.append('endDate', data.endDate);

			return adminRequest<Banner>('/admin/banners', {
				method: 'POST',
				body: formData,
			});
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateBannerRequest): Promise<Banner> => {
		try {
			const response = await axiosServer.patch<Banner>(`/admin/banners/${id}`, data);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await axiosServer.delete(`/admin/banners/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	updateOrder: async (data: UpdateBannerOrderRequest): Promise<Banner[]> => {
		try {
			const response = await axiosServer.patch<Banner[]>('/admin/banners/order/bulk', data);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const sometimeArticles = {
	uploadImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			;
			;

			const formData = new FormData();
			formData.append("image", imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/sometime-articles/upload', {
				method: 'POST',
				body: formData,
			});
			;
			return data;
		} catch (error: any) {
			throw error;
		}
	},

	getList: async (params?: {
		category?: string;
		status?: string;
		page?: number;
		limit?: number;
	}): Promise<AdminSometimeArticleListResponse> => {
		try {
			;
			const response =
				await axiosNextGen.get<AdminSometimeArticleListResponse>(
					"/admin/sometime-articles",
					{ params },
				);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	get: async (id: string): Promise<AdminSometimeArticleDetail> => {
		try {
			;
			const response = await axiosNextGen.get<AdminSometimeArticleDetail>(
				`/admin/sometime-articles/${id}`,
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (
		data: CreateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			;
			const response = await axiosNextGen.post<AdminSometimeArticleDetail>(
				"/admin/sometime-articles",
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	update: async (
		id: string,
		data: UpdateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			;
			const response = await axiosNextGen.patch<AdminSometimeArticleDetail>(
				`/admin/sometime-articles/${id}`,
				data,
			);
			;
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			;
			await axiosNextGen.delete(`/admin/sometime-articles/${id}`);
			;
		} catch (error: any) {
			throw error;
		}
	},
};

// ==================== 앱 리뷰 ====================
export interface AppReviewItem {
	pk: string;
	store: 'APP_STORE' | 'PLAY_STORE';
	reviewId: string;
	rating: number;
	title: string;
	body: string;
	author: string;
	appVersion: string;
	language: string;
	createdAt: string;
	collectedAt: string;
	isFeatured?: boolean;
	featuredAt?: string;
	displayNickname?: string;
	displayUniversity?: { name: string; logoFile: string | null };
}

export interface CommunityReviewArticle {
	id: string;
	title: string | null;
	body: string;
	author: {
		nickname: string;
		university: { name: string; logoFile: string | null } | null;
	} | null;
	isFeatured: boolean;
	featuredAt: string | null;
	createdAt: string;
}

export interface CommunityReviewArticlesResponse {
	items: CommunityReviewArticle[];
	nextCursor: string | null;
	total: number;
}

export interface AppReviewsResponse {
	items: AppReviewItem[];
	nextCursor: string | null;
	totalScannedCount: number;
}

export interface AppReviewStatsResponse {
	totalCount: number;
	averageRating: number;
	byStore: { store: string; count: number; averageRating: number }[];
	ratingDistribution: { rating: number; count: number }[];
	lastCollectedAt: string;
}

export interface AppReviewsParams {
	store?: 'APP_STORE' | 'PLAY_STORE';
	rating?: number;
	startDate?: string;
	endDate?: string;
	limit?: number;
	cursor?: string;
}

export const appReviews = {
	getList: async (params: AppReviewsParams = {}): Promise<AppReviewsResponse> => {
		try {
			const response = await axiosServer.get('/admin/app-reviews', { params });
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getStats: async (): Promise<AppReviewStatsResponse> => {
		try {
			const response = await axiosServer.get('/admin/app-reviews/stats');
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	toggleFeatured: async (pk: string): Promise<{ pk: string; isFeatured: boolean }> => {
		try {
			const response = await axiosServer.patch(
				`/admin/app-reviews/${encodeURIComponent(pk)}/featured`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

export const communityReviewArticles = {
	getList: async (
		params: { limit?: number; cursor?: string } = {},
	): Promise<CommunityReviewArticlesResponse> => {
		try {
			const response = await axiosServer.get('/admin/community/articles', {
				params: { ...params, category: 'review' },
			});
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	toggleFeatured: async (
		articleId: string,
	): Promise<{ id: string; isFeatured: boolean; featuredAt: string | null }> => {
		try {
			const response = await axiosServer.patch(
				`/admin/community/articles/${articleId}/featured`,
			);
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};

// ==================== 통합 리뷰 (Public) ====================
export type PublicReviewSource = 'APP_STORE' | 'PLAY_STORE' | 'COMMUNITY' | 'HOT';

export interface PublicReviewItem {
	id: string;
	source: PublicReviewSource;
	rating: number | null;
	title: string | null;
	body: string;
	author: {
		nickname: string;
		university: { name: string; logoFile: string | null } | null;
	} | null;
	featuredAt: string;
	createdAt: string;
}

export interface PublicReviewsResponse {
	items: PublicReviewItem[];
}

export interface FeaturedAppReviewsResponse {
	items: AppReviewItem[];
	nextCursor: string | null;
}

export const publicReviews = {
	getList: async (params: { type?: 'app' | 'community' | 'inapp' | 'hot' | 'review'; limit?: number } = {}): Promise<PublicReviewsResponse> => {
		try {
			const response = await axiosServer.get('/public-reviews', { params });
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},

	getFeaturedAppReviews: async (
		params: { store?: 'APP_STORE' | 'PLAY_STORE'; limit?: number; cursor?: string } = {},
	): Promise<FeaturedAppReviewsResponse> => {
		try {
			const response = await axiosServer.get('/app-reviews/featured', { params });
			return response.data;
		} catch (error: any) {
			throw error;
		}
	},
};
