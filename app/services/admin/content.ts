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
			console.log('활성 배경 프리셋 목록 조회 요청');
			const response = await axiosNextGen.get<BackgroundPresetsResponse>(
				'/admin/background-presets/active',
			);
			console.log('활성 배경 프리셋 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('활성 배경 프리셋 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	upload: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			console.log('=== 배경 이미지 업로드 시작 ===');
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/background-presets/upload', {
				method: 'POST',
				body: formData,
			});
			console.log('배경 이미지 업로드 성공:', data);
			console.log('=== 배경 이미지 업로드 종료 ===');
			return data;
		} catch (error: any) {
			console.error('배경 이미지 업로드 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	uploadAndCreate: async (
		imageFile: File,
		data: UploadAndCreatePresetRequest,
	): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 통합 생성 요청:', data);
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

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
			console.log('배경 프리셋 통합 생성 응답:', responseData);
			return responseData;
		} catch (error: any) {
			console.error('배경 프리셋 통합 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	create: async (data: CreatePresetRequest): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 생성 요청:', data);
			const response = await axiosNextGen.post('/admin/background-presets', data);
			console.log('배경 프리셋 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('배경 프리셋 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: Partial<CreatePresetRequest>): Promise<BackgroundPreset> => {
		try {
			console.log('배경 프리셋 수정 요청:', { id, data });
			const response = await axiosNextGen.put(`/admin/background-presets/${id}`, data);
			console.log('배경 프리셋 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('배경 프리셋 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log('배경 프리셋 삭제 요청:', id);
			await axiosNextGen.delete(`/admin/background-presets/${id}`);
			console.log('배경 프리셋 삭제 완료');
		} catch (error: any) {
			console.error('배경 프리셋 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},
};

// 카드뉴스 관련 API
export const cardNews = {
	uploadSectionImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			console.log('섹션 이미지 업로드 요청');
			console.log('File 정보:', {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
				lastModified: imageFile.lastModified,
			});

			const formData = new FormData();
			formData.append('image', imageFile);

			const data = await adminRequest<UploadImageResponse>(
				'/admin/posts/card-news/section-images/upload',
				{
					method: 'POST',
					body: formData,
				},
			);
			console.log('섹션 이미지 업로드 응답:', data);
			return data;
		} catch (error: any) {
			console.error('섹션 이미지 업로드 중 오류:', error);
			console.error('오류 상세 정보:', error.message);
			throw error;
		}
	},

	create: async (data: CreateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 생성 요청:', data);
			const response = await axiosNextGen.post<AdminCardNewsItem>('/admin/posts/card-news', data);
			console.log('카드뉴스 생성 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 생성 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	get: async (id: string): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 조회 요청:', id);
			const response = await axiosNextGen.get<AdminCardNewsItem>(`/admin/posts/card-news/${id}`);
			console.log('카드뉴스 조회 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getList: async (page: number = 1, limit: number = 20): Promise<AdminCardNewsListResponse> => {
		try {
			console.log('카드뉴스 목록 조회 요청:', { page, limit });
			const response = await axiosNextGen.get<AdminCardNewsListResponse>('/admin/posts/card-news', {
				params: {
					page,
					limit,
				},
			});
			console.log('카드뉴스 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	update: async (id: string, data: UpdateCardNewsRequest): Promise<AdminCardNewsItem> => {
		try {
			console.log('카드뉴스 수정 요청:', { id, data });
			const response = await axiosNextGen.put<AdminCardNewsItem>(
				`/admin/posts/card-news/${id}`,
				data,
			);
			console.log('카드뉴스 수정 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 수정 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log('카드뉴스 삭제 요청:', id);
			await axiosNextGen.delete(`/admin/posts/card-news/${id}`);
			console.log('카드뉴스 삭제 완료');
		} catch (error: any) {
			console.error('카드뉴스 삭제 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	publish: async (id: string, data?: PublishCardNewsRequest): Promise<PublishCardNewsResponse> => {
		try {
			console.log('카드뉴스 발행 요청:', id, data);
			const response = await axiosNextGen.post<PublishCardNewsResponse>(
				`/admin/posts/card-news/${id}/publish`,
				data || {},
			);
			console.log('카드뉴스 발행 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카드뉴스 발행 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
			throw error;
		}
	},

	getCategories: async () => {
		try {
			console.log('카테고리 목록 조회 요청');
			const response = await axiosNextGen.get('/articles/category/list');
			console.log('카테고리 목록 응답:', response.data);
			return response.data;
		} catch (error: any) {
			console.error('카테고리 목록 조회 중 오류:', error);
			console.error('오류 상세 정보:', error.response?.data || error.message);
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
			console.error('배너 목록 조회 중 오류:', error);
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
			console.error('배너 등록 중 오류:', error);
			throw error;
		}
	},

	update: async (id: string, data: UpdateBannerRequest): Promise<Banner> => {
		try {
			const response = await axiosServer.patch<Banner>(`/admin/banners/${id}`, data);
			return response.data;
		} catch (error: any) {
			console.error('배너 수정 중 오류:', error);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			await axiosServer.delete(`/admin/banners/${id}`);
		} catch (error: any) {
			console.error('배너 삭제 중 오류:', error);
			throw error;
		}
	},

	updateOrder: async (data: UpdateBannerOrderRequest): Promise<Banner[]> => {
		try {
			const response = await axiosServer.patch<Banner[]>('/admin/banners/order/bulk', data);
			return response.data;
		} catch (error: any) {
			console.error('배너 순서 변경 중 오류:', error);
			throw error;
		}
	},
};

export const sometimeArticles = {
	uploadImage: async (imageFile: File): Promise<UploadImageResponse> => {
		try {
			console.log("썸타임 이야기 이미지 업로드 요청");
			console.log("File 정보:", {
				name: imageFile.name,
				type: imageFile.type,
				size: imageFile.size,
			});

			const formData = new FormData();
			formData.append("image", imageFile);

			const data = await adminRequest<UploadImageResponse>('/admin/sometime-articles/upload', {
				method: 'POST',
				body: formData,
			});
			console.log("썸타임 이야기 이미지 업로드 응답:", data);
			return data;
		} catch (error: any) {
			console.error("썸타임 이야기 이미지 업로드 중 오류:", error);
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
			console.log("썸타임 이야기 목록 조회 요청:", params);
			const response =
				await axiosNextGen.get<AdminSometimeArticleListResponse>(
					"/admin/sometime-articles",
					{ params },
				);
			console.log("썸타임 이야기 목록 응답:", response.data);
			return response.data;
		} catch (error: any) {
			console.error("썸타임 이야기 목록 조회 중 오류:", error);
			console.error("오류 상세 정보:", error.response?.data || error.message);
			throw error;
		}
	},

	get: async (id: string): Promise<AdminSometimeArticleDetail> => {
		try {
			console.log("썸타임 이야기 조회 요청:", id);
			const response = await axiosNextGen.get<AdminSometimeArticleDetail>(
				`/admin/sometime-articles/${id}`,
			);
			console.log("썸타임 이야기 조회 응답:", response.data);
			return response.data;
		} catch (error: any) {
			console.error("썸타임 이야기 조회 중 오류:", error);
			console.error("오류 상세 정보:", error.response?.data || error.message);
			throw error;
		}
	},

	create: async (
		data: CreateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			console.log("썸타임 이야기 생성 요청:", data);
			const response = await axiosNextGen.post<AdminSometimeArticleDetail>(
				"/admin/sometime-articles",
				data,
			);
			console.log("썸타임 이야기 생성 응답:", response.data);
			return response.data;
		} catch (error: any) {
			console.error("썸타임 이야기 생성 중 오류:", error);
			console.error("오류 상세 정보:", error.response?.data || error.message);
			throw error;
		}
	},

	update: async (
		id: string,
		data: UpdateSometimeArticleRequest,
	): Promise<AdminSometimeArticleDetail> => {
		try {
			console.log("썸타임 이야기 수정 요청:", { id, data });
			const response = await axiosNextGen.patch<AdminSometimeArticleDetail>(
				`/admin/sometime-articles/${id}`,
				data,
			);
			console.log("썸타임 이야기 수정 응답:", response.data);
			return response.data;
		} catch (error: any) {
			console.error("썸타임 이야기 수정 중 오류:", error);
			console.error("오류 상세 정보:", error.response?.data || error.message);
			throw error;
		}
	},

	delete: async (id: string): Promise<void> => {
		try {
			console.log("썸타임 이야기 삭제 요청:", id);
			await axiosNextGen.delete(`/admin/sometime-articles/${id}`);
			console.log("썸타임 이야기 삭제 완료");
		} catch (error: any) {
			console.error("썸타임 이야기 삭제 중 오류:", error);
			console.error("오류 상세 정보:", error.response?.data || error.message);
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
			console.error('앱 리뷰 목록 조회 중 오류:', error);
			throw error;
		}
	},

	getStats: async (): Promise<AppReviewStatsResponse> => {
		try {
			const response = await axiosServer.get('/admin/app-reviews/stats');
			return response.data;
		} catch (error: any) {
			console.error('앱 리뷰 통계 조회 중 오류:', error);
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
			console.error('앱 리뷰 외부 공개 토글 중 오류:', error);
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
			console.error('커뮤니티 리뷰 게시글 조회 중 오류:', error);
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
			console.error('커뮤니티 리뷰 외부 공개 토글 중 오류:', error);
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
			console.error('통합 리뷰 조회 중 오류:', error);
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
			console.error('Featured 앱 리뷰 조회 중 오류:', error);
			throw error;
		}
	},
};
