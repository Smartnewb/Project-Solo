import { adminRequest, adminGet, adminPost, adminPut, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';
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
			const res = await adminGet<{ data: BackgroundPresetsResponse }>('/admin/v2/content/background-presets/active');
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	upload: async (imageFile: File): Promise<UploadImageResponse> => {
		try {

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/v2/content/background-presets/upload', {
				method: 'POST',
				body: formData,
			});
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

			const formData = new FormData();
			formData.append('image', imageFile);
			formData.append('name', data.name);
			formData.append('displayName', data.displayName);
			if (data.order !== undefined) {
				formData.append('order', data.order.toString());
			}

			const responseData = await adminRequest<BackgroundPreset>('/admin/v2/content/background-presets/upload-and-create', {
				method: 'POST',
				body: formData,
			});
			return responseData;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (data: CreatePresetRequest): Promise<BackgroundPreset> => {
		try {
			return await adminPost<BackgroundPreset>('/admin/v2/content/background-presets', data);
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: Partial<CreatePresetRequest>): Promise<BackgroundPreset> => {
		try {
			return await adminPut<BackgroundPreset>(`/admin/v2/content/background-presets/${id}`, data);
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/v2/content/background-presets/${id}`);
		} catch (error: any) {
			throw error;
		}
	},
};

export interface CardNewsCategory {
	id: string;
	displayName: string;
	code: string;
	emojiUrl: string;
}

// 카드뉴스 관련 API
export const cardNews = {
	uploadSectionImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>(
				'/admin/v2/content/card-news/section-images/upload',
				{
					method: 'POST',
					body: formData,
				},
			);
			return data;
		} catch (error: any) {
			throw error;
		}
	},

	create: async (data: CreateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			return await adminPost<AdminCardNewsItem>('/admin/v2/content/card-news', data);
		} catch (error: any) {
			throw error;
		}
	},

	get: async (id: string): Promise<AdminCardNewsItem> => {
		try {
			const res = await adminGet<{ data: AdminCardNewsItem }>(`/admin/v2/content/card-news/${id}`);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	getList: async (page: number = 1, limit: number = 20): Promise<AdminCardNewsListResponse> => {
		try {
			const res = await adminGet<{ data: AdminCardNewsListResponse }>('/admin/v2/content/card-news', {
				page: String(page),
				limit: String(limit),
			});
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			return await adminPut<AdminCardNewsItem>(`/admin/v2/content/card-news/${id}`, data);
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/v2/content/card-news/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	publish: async (id: string, data?: PublishCardNewsRequest): Promise<PublishCardNewsResponse> => {
		try {
			return await adminPost<PublishCardNewsResponse>(
				`/admin/v2/content/card-news/${id}/publish`,
				data || {},
			);
		} catch (error: any) {
			throw error;
		}
	},

	getCategories: async (): Promise<CardNewsCategory[]> => {
		try {
			return await adminGet<CardNewsCategory[]>('/articles/category/list');
		} catch (error: any) {
			throw error;
		}
	},
};

export const banners = {
	getList: async (position?: BannerPosition): Promise<Banner[]> => {
		try {
			const params = position ? { position } : undefined;
			return await adminGet<Banner[]>('/admin/v2/banners', params);
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

			return adminRequest<Banner>('/admin/v2/banners', {
				method: 'POST',
				body: formData,
			});
		} catch (error: any) {
			throw error;
		}
	},

	update: async (id: string, data: UpdateBannerRequest): Promise<Banner> => {
		try {
			return await adminPatch<Banner>(`/admin/v2/banners/${id}`, data);
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/v2/banners/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	updateOrder: async (data: UpdateBannerOrderRequest): Promise<Banner[]> => {
		try {
			return await adminPatch<Banner[]>('/admin/v2/banners/order/bulk', data);
		} catch (error: any) {
			throw error;
		}
	},
};

export const sometimeArticles = {
	uploadImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {

			const formData = new FormData();
			formData.append("image", imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/v2/sometime-articles/upload', {
				method: 'POST',
				body: formData,
			});
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
			const query: Record<string, string> = {};
			if (params?.category) query.category = params.category;
			if (params?.status) query.status = params.status;
			if (params?.page !== undefined) query.page = String(params.page);
			if (params?.limit !== undefined) query.limit = String(params.limit);
			return await adminGet<AdminSometimeArticleListResponse>(
				"/admin/v2/sometime-articles",
				Object.keys(query).length > 0 ? query : undefined,
			);
		} catch (error: any) {
			throw error;
		}
	},

	get: async (id: string): Promise<AdminSometimeArticleDetail> => {
		try {
			return await adminGet<AdminSometimeArticleDetail>(`/admin/v2/sometime-articles/${id}`);
		} catch (error: any) {
			throw error;
		}
	},

	create: async (
		data: CreateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			return await adminPost<AdminSometimeArticleDetail>("/admin/v2/sometime-articles", data);
		} catch (error: any) {
			throw error;
		}
	},

	update: async (
		id: string,
		data: UpdateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			return await adminPatch<AdminSometimeArticleDetail>(`/admin/v2/sometime-articles/${id}`, data);
		} catch (error: any) {
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await adminDelete(`/admin/v2/sometime-articles/${id}`);
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
			const query: Record<string, string> = {};
			if (params.store) query.store = params.store;
			if (params.rating !== undefined) query.rating = String(params.rating);
			if (params.startDate) query.startDate = params.startDate;
			if (params.endDate) query.endDate = params.endDate;
			if (params.limit !== undefined) query.limit = String(params.limit);
			if (params.cursor) query.cursor = params.cursor;
			const res = await adminGet<{ data: AppReviewsResponse }>(
				'/admin/v2/app-reviews',
				Object.keys(query).length > 0 ? query : undefined,
			);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	getStats: async (): Promise<AppReviewStatsResponse> => {
		try {
			const res = await adminGet<{ data: AppReviewStatsResponse }>('/admin/v2/app-reviews/stats');
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	toggleFeatured: async (pk: string): Promise<{ pk: string; isFeatured: boolean }> => {
		try {
			return await adminPatch<{ pk: string; isFeatured: boolean }>(
				`/admin/v2/app-reviews/${encodeURIComponent(pk)}/featured`,
			);
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
			const query: Record<string, string> = { category: 'review' };
			if (params.limit !== undefined) query.limit = String(params.limit);
			if (params.cursor) query.cursor = params.cursor;
			const res = await adminGet<{ data: CommunityReviewArticlesResponse }>('/admin/v2/community/posts', query);
			return res.data;
		} catch (error: any) {
			throw error;
		}
	},

	toggleFeatured: async (
		articleId: string,
	): Promise<{ id: string; isFeatured: boolean; featuredAt: string | null }> => {
		try {
			return await adminPatch<{ id: string; isFeatured: boolean; featuredAt: string | null }>(
				`/admin/v2/community/posts/${articleId}/status`,
			);
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
			const query: Record<string, string> = {};
			if (params.type) query.type = params.type;
			if (params.limit !== undefined) query.limit = String(params.limit);
			return await adminGet<PublicReviewsResponse>(
				'/public-reviews',
				Object.keys(query).length > 0 ? query : undefined,
			);
		} catch (error: any) {
			throw error;
		}
	},

	getFeaturedAppReviews: async (
		params: { store?: 'APP_STORE' | 'PLAY_STORE'; limit?: number; cursor?: string } = {},
	): Promise<FeaturedAppReviewsResponse> => {
		try {
			const query: Record<string, string> = {};
			if (params.store) query.store = params.store;
			if (params.limit !== undefined) query.limit = String(params.limit);
			if (params.cursor) query.cursor = params.cursor;
			return await adminGet<FeaturedAppReviewsResponse>(
				'/app-reviews/featured',
				Object.keys(query).length > 0 ? query : undefined,
			);
		} catch (error: any) {
			throw error;
		}
	},
};
