import { adminGet, adminPatch, adminDelete } from '@/shared/lib/http/admin-fetch';

export const KEYWORD_CATEGORIES = {
	HOBBY: '취미',
	FOOD: '음식',
	MUSIC: '음악',
	TRAVEL: '여행',
	SPORT: '운동',
	CULTURE: '문화',
	LIFESTYLE: '라이프',
	STUDY: '학업',
	OTHER: '기타',
} as const;

export type KeywordCategory = keyof typeof KEYWORD_CATEGORIES;

export interface KeywordItem {
	keyword: string;
	normalizedKeyword: string;
	category: KeywordCategory;
	userCount: number;
	iconUrl: string | null;
	firstCreatedAt: string;
}

export interface KeywordsResponse {
	items: KeywordItem[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

export const keywords = {
	getAll: async (params: { page?: number; pageSize?: number; search?: string }) => {
		const queryParams: Record<string, string> = {};
		if (params.page != null) queryParams.page = String(params.page);
		if (params.pageSize != null) queryParams.pageSize = String(params.pageSize);
		if (params.search) queryParams.search = params.search;
		return adminGet<KeywordsResponse>('/v4/admin/keywords', queryParams);
	},

	updateIcon: async (normalizedKeyword: string, iconUrl: string) => {
		return adminPatch<{ success: boolean }>(
			'/v4/admin/keywords/icon',
			{ normalizedKeyword, iconUrl },
		);
	},

	updateName: async (oldKeyword: string, newKeyword: string) => {
		return adminPatch<{ updatedCount: number }>(
			'/v4/admin/keywords/name',
			{ oldKeyword, newKeyword },
		);
	},

	updateCategory: async (normalizedKeyword: string, category: KeywordCategory) => {
		return adminPatch<{ updatedCount: number }>(
			'/v4/admin/keywords/category',
			{ normalizedKeyword, category },
		);
	},

	delete: async (keyword: string) => {
		const encoded = encodeURIComponent(keyword);
		return adminDelete<{ deletedCount: number }>(
			`/v4/admin/keywords/${encoded}`,
		);
	},
};
